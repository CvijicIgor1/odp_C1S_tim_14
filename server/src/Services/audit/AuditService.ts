import { IAuditService } from "../../Domain/services/audit/IAuditService";
import { IAuditRepository } from "../../Domain/repositories/audit/IAuditRepository";
import { AuditLog } from "../../Domain/models/AuditLog";
import { AuditAction } from "../../Domain/enums/AuditLog";
import { AuditLogDto } from "../../Domain/DTOs/audit/AuditLogDto";
import { PaginatedListDto } from "../../Domain/DTOs/entity/PaginatedListDto";

const parseDetail = (raw: string | null): Record<string, unknown> | null => {
    if (raw === null || raw === undefined) return null;
    if (raw.trim() === "") return null;
    try {
        return JSON.parse(raw) as Record<string, unknown>;
    } catch {
        return { value: raw };
    }
};

export class AuditService implements IAuditService {
    public constructor(private readonly auditRepo: IAuditRepository) {}

    private toDto(log: AuditLog): AuditLogDto {
        return new AuditLogDto(
            log.id,
            log.user_id,
            log.username,
            log.action,
            log.entity_type,
            log.entity_id,
            parseDetail(log.detail),
            log.ip_address,
            log.created_at
        );
    }

    async log(
        userId: number | null,
        action: AuditAction,
        entityType?: string,
        entityId?: number,
        detail?: string,
        ipAddress?: string,
        username?: string
    ): Promise<void> {
        await this.auditRepo.create(
            new AuditLog(0, userId ?? null, username ?? null, action, entityType ?? null, entityId ?? null, detail ?? null, ipAddress ?? null)
        );
    }

    async findAll(page: number, limit: number): Promise<PaginatedListDto<AuditLogDto>> {
        const { logs, totalNumber } = await this.auditRepo.findAll(page, limit);
        return new PaginatedListDto(logs.map((l) => this.toDto(l)), totalNumber, page, limit);
    }
}
