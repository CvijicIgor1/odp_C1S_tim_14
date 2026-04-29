import { IAuditService } from "../../Domain/services/audit/IAuditService";
import { IAuditRepository } from "../../Domain/repositories/audit/IAuditRepository";
import { AuditLog } from "../../Domain/models/AuditLog";
import { AuditAction } from "../../Domain/enums/AuditLog";
import { AuditLogDto } from "../../Domain/DTOs/audit/AuditLogDto";
import { PaginatedListDto } from "../../Domain/DTOs/entity/PaginatedListDto";

export class AuditService implements IAuditService {
    public constructor(private readonly auditRepo: IAuditRepository) {}

    async log(
        userId: number,
        action: AuditAction,
        entityType?: string,
        entityId?: number,
        detail?: string
    ): Promise<void> {
        await this.auditRepo.create(
            new AuditLog(0, userId, action, entityType ?? "", entityId ?? 0, detail ?? "")
        );
    }

    async findAll(page: number, limit: number): Promise<PaginatedListDto<AuditLogDto>> {
        return this.auditRepo.findAll(page, limit);
    }
}
