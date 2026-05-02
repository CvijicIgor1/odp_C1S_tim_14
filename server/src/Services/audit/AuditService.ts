import { IAuditService } from "../../Domain/services/audit/IAuditService";
import { IAuditRepository } from "../../Domain/repositories/audit/IAuditRepository";
import { AuditLog } from "../../Domain/models/AuditLog";
import { AuditAction } from "../../Domain/enums/AuditLog";
import { AuditLogDto } from "../../Domain/DTOs/audit/AuditLogDto";
import { PaginatedListDto } from "../../Domain/DTOs/entity/PaginatedListDto";

export class AuditService implements IAuditService {
    public constructor(private readonly auditRepo: IAuditRepository) {}

    async log(
        userId: number | null,
        action: AuditAction,
        entityType?: string,
        entityId?: number,
        detail?: string,
        ipAddress?: string
    ): Promise<void> {
        await this.auditRepo.create(
            new AuditLog(0, userId ?? null, action, entityType ?? null, entityId ?? null, detail ?? null, ipAddress ?? null)
        );
    }

    async findAll(page: number, limit: number): Promise<PaginatedListDto<AuditLogDto>> {
        return this.auditRepo.findAll(page, limit);
    }
}
