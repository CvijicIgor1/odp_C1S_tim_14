import { Request, Response, Router } from "express";
import { IUserService } from "../../Domain/services/users/IUserService";
import { IAuditService } from "../../Domain/services/audit/IAuditService";
import { authenticate } from "../../Middlewares/authentification/AuthMiddleware";
import { authorize } from "../../Middlewares/authorization/AuthorizeMiddleware";
import { UserRole } from "../../Domain/enums/UserRole";
import { AuditAction } from "../../Domain/enums/AuditLog";
import { validateUpdateRole, validateUpdateStatus, validateUpdateProfile, validatePasswordUpdate } from "../validators/users/UserValidator";

export class UserController {
  private readonly router = Router();

  public constructor(private readonly userService: IUserService, private readonly auditService: IAuditService) {
    this.router.get("/users",          authenticate, authorize(UserRole.ADMIN), this.getAll.bind(this));
    this.router.get("/users/all", authenticate, authorize(UserRole.ADMIN), this.getAll.bind(this));
    this.router.get("/users/:id", authenticate, this.getById.bind(this));
    this.router.put("/users/:id/role", authenticate, authorize(UserRole.ADMIN), this.updateRole.bind(this));
    this.router.patch("/users/:id/role", authenticate, authorize(UserRole.ADMIN), this.updateRole.bind(this));
    this.router.patch("/users/:id/status",          authenticate, authorize(UserRole.ADMIN), this.updateStatus.bind(this));
    this.router.patch("/users/:id/profile",  authenticate, this.updateProfile.bind(this));
    this.router.patch("/users/:id/deactivate", authenticate, authorize(UserRole.ADMIN), this.deactivate.bind(this));
  }

  private async getAll(req: Request, res: Response): Promise<void> {
    const users = await this.userService.getAll();
    res.status(200).json({ success: true, data: users });
  }

  private async getById(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid id" }); return; }
    const user = await this.userService.getById(id);
    if (!user) { res.status(404).json({ success: false, message: "User not found" }); return; }
    res.status(200).json({ success: true, data: user });
  }

  private async updateRole(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid id" }); return; }
    const { role } = req.body as { role?: UserRole };
    const error = validateUpdateRole(role);
    if (error) { res.status(400).json({ success: false, message: error.message }); return; }
    const ok = await this.userService.updateRole(id, role as UserRole);
    if (!ok) { res.status(404).json({ success: false, message: "User not found" }); return; }
    await this.auditService.log(req.user!.user_id, AuditAction.UPDATE, "user", id, `role=${role}`, req.ip, req.user!.username);
    res.status(200).json({ success: true, message: "User role updated" });
  }

  private async updateStatus(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid id" }); return; }
    const { isActive } = req.body as { isActive?: boolean };
    const error = validateUpdateStatus(isActive);
    if (error) { res.status(400).json({ success: false, message: error.message }); return; }
    const ok = await this.userService.updateStatus(id, isActive as boolean);
    if (!ok) { res.status(404).json({ success: false, message: "User not found" }); return; }
    await this.auditService.log(req.user!.user_id, AuditAction.UPDATE, "user", id, `isActive=${isActive}`, req.ip, req.user!.username);
    res.status(200).json({ success: true, message: "User status updated" });
  }

  private async deactivate(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid id" }); return; }
    const ok = await this.userService.deactivate(id);
    if (!ok) { res.status(404).json({ success: false, message: "User not found" }); return; }
    await this.auditService.log(req.user!.user_id, AuditAction.UPDATE, "user", id, "deactivated", req.ip, req.user!.username);
    res.status(200).json({ success: true, message: "User deactivated" });
  }

  
  private async updateProfile(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid id" }); return; }
    if (req.user!.user_id !== id) { res.status(403).json({ success: false, message: "Forbidden" }); return; }
    const { username, email, avatar, newPassword } = req.body as {
      username?: string; email?: string; avatar?: string; newPassword?: string;
    };
    const error = validateUpdateProfile({ username, email });
    if (error) { res.status(400).json({ success: false, message: error.message }); return; }
    const passwordError = validatePasswordUpdate(newPassword);
    if (passwordError) { res.status(400).json({ success: false, message: passwordError.message }); return; }
    const ok = await this.userService.updateProfile(id, username as string, email as string, avatar ?? "", newPassword);
    if (!ok) { res.status(404).json({ success: false, message: "User not found or update failed" }); return; }
    await this.auditService.log(req.user!.user_id, AuditAction.UPDATE, "user", id, "profile", req.ip, req.user!.username);
    res.status(200).json({ success: true, message: "Profile updated" });
  }

  public getRouter(): Router { return this.router; }
}
