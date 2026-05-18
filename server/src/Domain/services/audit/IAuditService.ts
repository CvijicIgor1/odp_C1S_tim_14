import { AuditAction } from "../../enums/AuditLog";
import { AuditLogDto } from "../../DTOs/audit/AuditLogDto";
import { PaginatedListDto } from "../../DTOs/paginatedList/PaginatedListDto";

export interface IAuditService {
    log(userId: number | null, action: AuditAction, entityType?: string | null, entityId?: number | null, detail?: string | null, ipAddress?: string | null, username?: string | null): Promise<void>;
    findAll(page: number, limit: number): Promise<PaginatedListDto<AuditLogDto>>;
}
