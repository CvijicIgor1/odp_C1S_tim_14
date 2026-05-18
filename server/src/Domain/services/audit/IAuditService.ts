import { AuditAction } from "../../enums/AuditLog";
import { AuditLogDto } from "../../DTOs/audit/AuditLogDto";
import { PaginatedListDto } from "../../DTOs/paginatedList/PaginatedListDto";

export interface IAuditService {
    log(userId: number | null, action: AuditAction, entityType?: string, entityId?: number, detail?: string, ipAddress?: string, username?: string): Promise<void>;
    findAll(page: number, limit: number): Promise<PaginatedListDto<AuditLogDto>>;
}
