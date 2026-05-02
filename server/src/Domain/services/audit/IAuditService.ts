import { AuditAction } from "../../enums/AuditLog";
import { AuditLogDto } from "../../DTOs/audit/AuditLogDto";
import { PaginatedListDto } from "../../DTOs/entity/PaginatedListDto";

export interface IAuditService {
    log(userId: number | null, action: AuditAction, entityType?: string, entityId?: number, detail?: string, ipAddress?: string): Promise<void>;
    findAll(page: number, limit: number): Promise<PaginatedListDto<AuditLogDto>>;
}
