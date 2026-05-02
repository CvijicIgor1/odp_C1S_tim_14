import { AuditLogDto } from "../../../Domain/DTOs/audit/AuditLogDto";
import { PaginatedListDto } from "../../../Domain/DTOs/entity/PaginatedListDto";
import { AuditLog } from "../../../Domain/models/AuditLog";
import { IAuditRepository } from "../../../Domain/repositories/audit/IAuditRepository";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";
import { DbManager } from "../../connection/DbConnectionPool";
import { ResultSetHeader, RowDataPacket } from 'mysql2';

const safeInt = (n: number): number => Math.max(0, Math.floor(n));

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
        `INSERT INTO audits (user_id, action, entity_type, entity_id, detail, ip_address)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [log.user_id ?? null, log.action, log.entity_type ?? null,
         log.entity_id ?? null, log.detail ?? null, log.ip_address ?? null]
      );
      if (result.insertId === 0) return new AuditLog();
      return new AuditLog(result.insertId, log.user_id, log.action,
        log.entity_type, log.entity_id, log.detail, log.ip_address);
    } catch (err) {
      this.logger.error("AuditRepository", "create failed", err);
      return new AuditLog();
    } finally { res.conn.release(); }
  }

  async findAll(page: number, limit: number): Promise<PaginatedListDto<AuditLogDto>> {
    const res = await this.db.getReadConnection();
    if (!res) return new PaginatedListDto([], 0, page, limit);
    const lim    = safeInt(Math.max(1, limit));
    const offset = safeInt(Math.max(0, (page - 1) * lim));
    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT au.*, u.username
         FROM audits au
         LEFT JOIN users u ON au.user_id = u.id
         ORDER BY au.created_at DESC
         LIMIT ${lim} OFFSET ${offset}`
      );
      const [cnt] = await res.conn.execute<RowDataPacket[]>(
        `SELECT COUNT(*) as total FROM audits`
      );
      const items = rows.map(
        (l) => new AuditLogDto(
          l.id, l.user_id ?? null,
          l.action, l.entity_type ?? null, l.entity_id ?? null,
          l.detail ? (JSON.parse(l.detail as string) as Record<string, unknown>) : null,
          l.ip_address ?? null,
          new Date(l.created_at as string)
        )
      );
      return new PaginatedListDto(items, cnt[0]?.total ?? 0, page, limit);
    } catch (err) {
      this.logger.error("AuditRepository", "findAll failed", err);
      return new PaginatedListDto([], 0, page, limit);
    } finally { res.conn.release(); }
  }
}