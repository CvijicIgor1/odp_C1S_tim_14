import { Request, Response, Router } from "express";
import { DbManager } from "../../Database/connection/DbConnectionPool";
import { IAuditService } from "../../Domain/services/audit/IAuditService";
import { AuditAction } from "../../Domain/enums/AuditLog";
import { UserRole } from "../../Domain/enums/UserRole";
import { authenticate } from "../../Middlewares/authentification/AuthMiddleware";
import { authorize } from "../../Middlewares/authorization/AuthorizeMiddleware";

export class HealthController {
  private readonly router = Router();

  public constructor(
    private readonly db: DbManager,
    private readonly auditService: IAuditService
  ) {
    this.router.get("/health", this.getHealth.bind(this));
    this.router.get("/health/db", authenticate, authorize(UserRole.ADMIN), this.getDbHealth.bind(this));
    this.router.post("/health/failover", authenticate, authorize(UserRole.ADMIN), this.failover.bind(this));
  }

  // GET /health — server uptime
  private getHealth(_req: Request, res: Response): void {
    res.status(200).json({ success: true, data: { status: "healthy", uptime: process.uptime() } });
  }

  // GET /health/db — node статуси
  private getDbHealth(_req: Request, res: Response): void {
    res.status(200).json({ success: true, data: this.db.getNodes() });
  }

  // POST /health/failover — Промоција slave у master
  private async failover(req: Request, res: Response): Promise<void> {
    const { slaveIndex } = req.body as { slaveIndex?: unknown };
    if (slaveIndex !== 0 && slaveIndex !== 1) {
      res.status(400).json({ success: false, message: "slaveIndex must be 0 or 1" });
      return;
    }
    const result = await this.db.promoteSlaveToMaster(slaveIndex as 0 | 1);
    if (!result.success) {
      res.status(400).json({ success: false, message: result.message });
      return;
    }
    await this.auditService.log(req.user!.user_id, AuditAction.FAILOVER, "db", slaveIndex, result.message, req.ip);
    res.status(200).json({ success: true, message: result.message });
  }

  public getRouter(): Router { return this.router; }
}
