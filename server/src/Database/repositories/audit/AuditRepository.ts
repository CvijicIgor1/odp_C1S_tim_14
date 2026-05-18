import { AuditLog } from "../../../Domain/models/AuditLog";
import { toLogError } from "../../../utils/logging";
import { IAuditRepository } from "../../../Domain/repositories/audit/IAuditRepository";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";
import { DbManager } from "../../connection/DbConnectionPool";
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { safeInt } from '../../../utils/pagination';

export class AuditRepository implements IAuditRepository{
    public constructor(
        private readonly db: DbManager,
        private readonly logger: ILoggerService
    ) {}

    async create(log: AuditLog): Promise<AuditLog> {
    const res = await this.db.getWriteConnection();
    if (!res) return new AuditLog();
    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `INSERT INTO audits (user_id, username, action, entity_type, entity_id, detail, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [log.user_id ?? null, log.username ?? null, log.action, log.entity_type ?? null,
         log.entity_id ?? null, log.detail ?? null, log.ip_address ?? null]
      );
      if (result.insertId === 0) return new AuditLog();
      return new AuditLog(result.insertId, log.user_id, log.username, log.action,
        log.entity_type, log.entity_id, log.detail, log.ip_address);
    } catch (err) {
      this.logger.error("AuditRepository", "create failed", toLogError(err instanceof Error ? err : String(err)));
      return new AuditLog();
    } finally { res.conn.release(); }
  }

  async findAll(page: number, limit: number): Promise<{ logs: AuditLog[]; totalNumber: number }> {
    const res = await this.db.getReadConnection();
    if (!res) return { logs: [], totalNumber: 0 };
    const lim    = safeInt(Math.max(1, limit), 1);
    const offset = safeInt(Math.max(0, (page - 1) * lim), 0);
    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT * FROM audits ORDER BY created_at DESC LIMIT ${lim} OFFSET ${offset}`
      );
      const [cnt] = await res.conn.execute<RowDataPacket[]>(
        `SELECT COUNT(*) as total FROM audits`
      );
      const logs = rows.map(
        (l) => new AuditLog(
          l.id, l.user_id ?? null, l.username ?? null,
          l.action, l.entity_type ?? null, l.entity_id ?? null,
          l.detail ?? null,
          l.ip_address ?? null,
          new Date(l.created_at as string)
        )
      );
      return { logs, totalNumber: cnt[0]?.total ?? 0 };
    } catch (err) {
      this.logger.error("AuditRepository", "findAll failed", toLogError(err instanceof Error ? err : String(err)));
      return { logs: [], totalNumber: 0 };
    } finally { res.conn.release(); }
  }
}