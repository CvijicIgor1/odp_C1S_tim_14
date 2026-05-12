import mysql, { Pool, PoolConnection } from "mysql2/promise";
import dotenv from "dotenv";
import { DbNode } from "../../Domain/models/DbNode";
import { NodeStatus } from "../../Domain/enums/NodeStatus";
import { HEALTH_CHECK_TIMEOUT, HEALTH_CHECK_INTERVAL_MS, DEGRADED_THRESHOLD_MS } from "../../Domain/constants/Constants";
import { ILoggerService } from "../../Domain/services/logger/ILoggerService";

dotenv.config();

const DB_NAME = process.env.DB_NAME ?? "project_db";

const masterPool: Pool = mysql.createPool({
  host:     process.env.DB_MASTER_HOST     ?? "localhost",
  port:     parseInt(process.env.DB_MASTER_PORT ?? "3306", 10),
  user:     process.env.DB_MASTER_USER     ?? "root",
  password: process.env.DB_MASTER_PASSWORD ?? "",
  database: process.env.DB_MASTER_NAME     ?? DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: HEALTH_CHECK_TIMEOUT,
});

const slave1Pool: Pool = mysql.createPool({
  host:     process.env.DB_SLAVE1_HOST     ?? "localhost",
  port:     parseInt(process.env.DB_SLAVE1_PORT ?? "3307", 10),
  user:     process.env.DB_SLAVE1_USER     ?? "root",
  password: process.env.DB_SLAVE1_PASSWORD ?? "",
  database: process.env.DB_SLAVE1_NAME     ?? DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: HEALTH_CHECK_TIMEOUT,
});

const slave2Pool: Pool = mysql.createPool({
  host:     process.env.DB_SLAVE2_HOST     ?? "localhost",
  port:     parseInt(process.env.DB_SLAVE2_PORT ?? "3308", 10),
  user:     process.env.DB_SLAVE2_USER     ?? "root",
  password: process.env.DB_SLAVE2_PASSWORD ?? "",
  database: process.env.DB_SLAVE2_NAME     ?? DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: HEALTH_CHECK_TIMEOUT,
});

interface NodeInfo { name: string; pool: Pool; node: DbNode; excludedFromReads?: boolean; isOriginalMaster?: boolean; }

export class DbManager {
  private master: NodeInfo;
  private slaves: NodeInfo[];
  private slaveRrIndex: number = 0;
  private healthTimer: NodeJS.Timeout | null = null;

  public constructor(private readonly logger: ILoggerService) {
    this.master = {
      name: "master", pool: masterPool, isOriginalMaster: true,
      node: new DbNode("master", process.env.DB_MASTER_HOST ?? "localhost", parseInt(process.env.DB_MASTER_PORT ?? "3306", 10)),
    };
    this.slaves = [
      { name: "slave1", pool: slave1Pool, node: new DbNode("slave1", process.env.DB_SLAVE1_HOST ?? "localhost", parseInt(process.env.DB_SLAVE1_PORT ?? "3307", 10)) },
      { name: "slave2", pool: slave2Pool, node: new DbNode("slave2", process.env.DB_SLAVE2_HOST ?? "localhost", parseInt(process.env.DB_SLAVE2_PORT ?? "3308", 10)) },
    ];
  }

  private async checkNode(info: NodeInfo): Promise<void> {
    const start = Date.now();
    let conn: PoolConnection | null = null;
    try {
      conn = await info.pool.getConnection();
      await conn.query("SELECT 1");
      const ms = Date.now() - start;
      info.node.status = ms > DEGRADED_THRESHOLD_MS ? NodeStatus.DEGRADED : NodeStatus.HEALTHY;
    } catch {
      info.node.status = NodeStatus.UNREACHABLE;
      info.node.failedConnections++;
      this.logger.warn("DB", `Node ${info.name} failed health check`);
    } finally {
      if (conn) conn.release();
      info.node.lastCheck = new Date();
    }
  }

  private async autoRestoreOriginalMaster(): Promise<void> {
    if (this.master.isOriginalMaster) return;
    const original = this.slaves.find(s => s.isOriginalMaster && s.node.status !== NodeStatus.UNREACHABLE);
    if (!original) return;
    let connCurrent: PoolConnection | null = null;
    try {
      connCurrent = await this.master.pool.getConnection();
      await connCurrent.query("SET GLOBAL read_only = 1");
    } catch (err) {
      this.logger.error("DB", `[AUTO-RESTORE] Failed to set read_only on ${this.master.name}`, err);
      return;
    } finally {
      if (connCurrent) connCurrent.release();
    }
    let connOriginal: PoolConnection | null = null;
    try {
      connOriginal = await original.pool.getConnection();
      await connOriginal.query("SET GLOBAL read_only = 0");
    } catch (err) {
      this.logger.error("DB", `[AUTO-RESTORE] Failed to disable read_only on original master`, err);
      try {
        const rb = await this.master.pool.getConnection();
        await rb.query("SET GLOBAL read_only = 0");
        rb.release();
      } catch { }
      return;
    } finally {
      if (connOriginal) connOriginal.release();
    }
    const demoted = this.master;
    const newSlaves = this.slaves
      .filter(s => !s.isOriginalMaster)
      .concat({ name: demoted.name, pool: demoted.pool, node: demoted.node, excludedFromReads: false });
    this.master = { name: original.name, pool: original.pool, node: original.node, isOriginalMaster: true };
    this.slaves = newSlaves;
    this.slaveRrIndex = 0;
    this.logger.warn("DB", `[AUTO-RESTORE] Original master (${original.name}) restored. Demoted: ${demoted.name}`);
  }

  private async autoPromoteIfMasterOffline(): Promise<void> {
    if (this.master.node.status !== NodeStatus.UNREACHABLE) return;
    const candidate = this.slaves.find(s => s.node.status !== NodeStatus.UNREACHABLE);
    if (!candidate) {
      this.logger.error("DB", "Master UNREACHABLE and no healthy slave available — system degraded");
      return;
    }
    let conn: PoolConnection | null = null;
    try {
      conn = await candidate.pool.getConnection();
      await conn.query("STOP REPLICA");
      await conn.query("RESET REPLICA ALL");
      await conn.query("SET GLOBAL read_only = 0");
    } catch (err) {
      this.logger.error("DB", `[AUTO-FAILOVER] Failed to prepare ${candidate.name} for promotion`, err);
      return;
    } finally {
      if (conn) conn.release();
    }
    const prevMaster = this.master;
    const candidateIdx = this.slaves.indexOf(candidate);
    const remainingSlaves = this.slaves.filter((_, i) => i !== candidateIdx);
    remainingSlaves.forEach(s => { s.node.status = NodeStatus.UNREACHABLE; s.excludedFromReads = true; });
    this.master = { name: candidate.name, pool: candidate.pool, node: candidate.node };
    this.slaves = [
      ...remainingSlaves,
      { name: prevMaster.name, pool: prevMaster.pool, node: prevMaster.node, excludedFromReads: true, isOriginalMaster: prevMaster.isOriginalMaster },
    ];
    this.slaveRrIndex = 0;
    this.logger.warn("DB", `[AUTO-FAILOVER] ${candidate.name} promoted to master (was: ${prevMaster.name})`);
  }

  private async measureReplicationLag(info: NodeInfo): Promise<void> {
    if (info.node.status === NodeStatus.UNREACHABLE) { info.node.replicationLagMs = null; return; }
    let conn: import("mysql2/promise").PoolConnection | null = null;
    try {
      conn = await info.pool.getConnection();
      const [rows] = await conn.query("SHOW SLAVE STATUS") as [Record<string, unknown>[], unknown];
      if (Array.isArray(rows) && rows.length > 0) {
        const lag = rows[0].Seconds_Behind_Master;
        info.node.replicationLagMs = typeof lag === "number" ? lag * 1000 : null;
      } else {
        info.node.replicationLagMs = null;
      }
    } catch {
      info.node.replicationLagMs = null;
    } finally {
      if (conn) conn.release();
    }
  }

  public async runHealthCheck(): Promise<void> {
    await Promise.all([this.master, ...this.slaves].map((n) => this.checkNode(n)));
    await Promise.all(this.slaves.map((s) => this.measureReplicationLag(s)));
    this.logger.info("DB", [this.master, ...this.slaves].map((n) => `${n.name}=${n.node.status}`).join(" | "));
    await this.autoPromoteIfMasterOffline();
    await this.autoRestoreOriginalMaster();
  }

  public async init(): Promise<void> {
    await this.runHealthCheck();
    this.healthTimer = setInterval(() => void this.runHealthCheck(), HEALTH_CHECK_INTERVAL_MS);
  }

  public async promoteSlaveToMaster(slaveIndex: 0 | 1): Promise<{ success: boolean; message: string }> {
    if (slaveIndex < 0 || slaveIndex >= this.slaves.length) {
      return { success: false, message: `Invalid slave index: ${slaveIndex}` };
    }
    const candidate = this.slaves[slaveIndex];
    if (candidate.node.status === NodeStatus.UNREACHABLE) {
      return { success: false, message: `Cannot promote ${candidate.name} — node is UNREACHABLE` };
    }
    let conn: PoolConnection | null = null;
    try {
      conn = await candidate.pool.getConnection();
      await conn.query("STOP REPLICA");
      await conn.query("RESET REPLICA ALL");
      await conn.query("SET GLOBAL read_only = 0");
    } catch (err) {
      this.logger.error("DB", `Failed to prepare ${candidate.name} for promotion`, err);
      return { success: false, message: `Could not promote ${candidate.name}` };
    } finally {
      if (conn) conn.release();
    }
    const prevMaster = this.master;
    const remainingSlaves = this.slaves.filter((_, i) => i !== slaveIndex);
    remainingSlaves.forEach(s => {s.node.status = NodeStatus.UNREACHABLE; s.excludedFromReads = true; });
    this.master = { name: candidate.name, pool: candidate.pool, node: candidate.node };
    this.slaves = [
      ...remainingSlaves,
      { name: prevMaster.name, pool: prevMaster.pool, node: prevMaster.node, excludedFromReads: true, isOriginalMaster: prevMaster.isOriginalMaster },
    ];
    this.slaveRrIndex = 0;
    this.logger.warn("DB", `Failover: ${candidate.name} promoted to master (replaced: ${prevMaster.name})`);
    return { success: true, message: `${candidate.name} promoted to master` };
  }

  /** All writes (INSERT/UPDATE/DELETE) → Master only */
  public async getWriteConnection(): Promise<{ conn: PoolConnection; nodeName: string } | null> {
    if (this.master.node.status === NodeStatus.UNREACHABLE) {
      this.logger.error("DB", "Master is UNREACHABLE — write not possible");
      return null;
    }
    try {
      const conn = await this.master.pool.getConnection();
      this.master.node.successfulConnections++;
      return { conn, nodeName: this.master.name };
    } catch (err) {
      this.master.node.status = NodeStatus.UNREACHABLE;
      this.master.node.failedConnections++;
      this.logger.error("DB", "Failed to connect to master", err);
      return null;
    }
  }

  /** All reads (SELECT) → Round-Robin slaves, fallback to Master */
  public async getReadConnection(): Promise<{ conn: PoolConnection; nodeName: string } | null> {
    const n = this.slaves.length;
    for (let i = 0; i < n; i++) {
      const idx = (this.slaveRrIndex + i) % n;
      const info = this.slaves[idx];
      if (info.excludedFromReads || info.node.status === NodeStatus.UNREACHABLE) continue;
      try {
        const conn = await info.pool.getConnection();
        this.slaveRrIndex = (idx + 1) % n;
        info.node.successfulConnections++;
        return { conn, nodeName: info.name };
      } catch (err) {
        info.node.status = NodeStatus.UNREACHABLE;
        info.node.failedConnections++;
        this.logger.warn("DB", `Slave ${info.name} unreachable, trying next`);
      }
    }
    // Fallback to master
    this.logger.warn("DB", "All slaves unreachable — falling back to master for read");
    if (this.master.node.status === NodeStatus.UNREACHABLE) {
      this.logger.error("DB", "Master also unreachable — read not possible");
      return null;
    }
    try {
      const conn = await this.master.pool.getConnection();
      this.master.node.successfulConnections++;
      return { conn, nodeName: this.master.name };
    } catch (err) {
      this.master.node.status = NodeStatus.UNREACHABLE;
      this.logger.error("DB", "Failed to connect to master for fallback read", err);
      return null;
    }
  }

  public getNodes(): DbNode[] { return [this.master.node, ...this.slaves.map((s) => s.node)]; }
  public getSlaveRrIndex(): number { return this.slaveRrIndex; }
  public stop(): void { if (this.healthTimer) clearInterval(this.healthTimer); }
}
