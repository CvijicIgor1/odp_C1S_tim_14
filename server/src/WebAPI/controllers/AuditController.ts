import { Request, Response, Router } from "express";
import { IAuditService } from "../../Domain/services/audit/IAuditService";
import { UserRole } from "../../Domain/enums/UserRole";
import { authenticate } from "../../Middlewares/authentification/AuthMiddleware";
import { authorize } from "../../Middlewares/authorization/AuthorizeMiddleware";
import { parsePagination } from "../../utils/pagination";

export class AuditController {
    private readonly router = Router();

    public constructor(private readonly auditService: IAuditService) {
        this.router.get("/audits/logs", authenticate, authorize(UserRole.ADMIN), this.getLogs.bind(this));
    }

    public getRouter(): Router { return this.router; }

    private async getLogs(req: Request, res: Response): Promise<void> {
        const { page, limit } = parsePagination(req.query as Record<string, unknown>);

        const result = await this.auditService.findAll(page, limit);
        res.status(200).json({ success: true, data: result });
    }
}
