import { Request, Response, Router } from "express";
import { ITeamReadService } from "../../Domain/services/teams/ITeamReadService";
import { ITeamWriteService } from "../../Domain/services/teams/ITeamWriteService";
import { ITeamMemberService } from "../../Domain/services/teams/ITeamMemberService";
import { IAuditService } from "../../Domain/services/audit/IAuditService";
import { authenticate } from "../../Middlewares/authentification/AuthMiddleware";
import { authorize } from '../../Middlewares/authorization/AuthorizeMiddleware';
import { UserRole } from "../../Domain/enums/UserRole";
import { TeamMemberRole } from "../../Domain/enums/TeamMemberRole";
import { AuditAction } from "../../Domain/enums/AuditLog";
import { TeamOperationResult } from "../../Domain/enums/TeamOperationResult";
import { UpdateRoleResult } from "../../Domain/enums/UpdateRoleResult";
import { CreateTeamDto } from "../../Domain/DTOs/teams/CreateTeamDto";
import { AddMemberDto } from "../../Domain/DTOs/teams/AddMemberDto";
import { UpdateMemberRoleDto } from "../../Domain/DTOs/teams/UpdateMemberRoleDto";
import { UpdateTeamDto } from "../../Domain/DTOs/teams/UpdateTeamDto";
import { validateCreateTeam, validateUpdateTeam, validateMemberRole } from "../validators/teams/TeamValidator";
import { parsePagination } from "../../utils/pagination";

export class TeamController {
    private readonly router = Router();
    public constructor(
        private readonly teamReadService: ITeamReadService,
        private readonly teamWriteService: ITeamWriteService,
        private readonly teamMemberService: ITeamMemberService,
        private readonly auditService: IAuditService
    ) {
        this.router.get("/teams", authenticate, this.getAll.bind(this));
        this.router.get("/teams/all", authenticate, authorize(UserRole.ADMIN), this.getAllAsAdmin.bind(this));
        this.router.post("/teams", authenticate, this.create.bind(this));
        this.router.get("/teams/:id", authenticate, this.getById.bind(this));
        this.router.put("/teams/:id", authenticate, this.update.bind(this));
        this.router.delete("/teams/:id", authenticate, this.delete.bind(this));
        this.router.get("/teams/:id/members", authenticate, this.getMembers.bind(this));
        this.router.post("/teams/:id/members", authenticate, this.addMember.bind(this));
        this.router.patch("/teams/:id/members/:userId/role", authenticate, this.updateMemberRole.bind(this));
        this.router.delete("/teams/:id/members/:userId", authenticate, this.removeMember.bind(this));
    }

    public getRouter(): Router { return this.router; }

    private async getAll(req: Request, res: Response): Promise<void> {
        const { page, limit } = parsePagination(req.query as Record<string, string | number | boolean | null | undefined>);
        const result = await this.teamReadService.getAll(req.user!.user_id, page, limit);
        res.status(200).json({ success: true, data: result });
    }

    private async getAllAsAdmin(req: Request, res: Response): Promise<void> {
        const { page, limit } = parsePagination(req.query as Record<string, string | number | boolean | null | undefined>);
        const result = await this.teamReadService.getAllAsAdmin(req.user!.user_id, page, limit, req.user?.role === UserRole.ADMIN);
        res.status(200).json({ success: true, data: result });
    }

    private async create(req: Request, res: Response): Promise<void> {
        const { name, description, avatar } = req.body as CreateTeamDto;
        const error = validateCreateTeam({ name, description, avatar } as CreateTeamDto);
        if (error) { res.status(400).json({ success: false, message: error.message }); return; }

        const team = await this.teamWriteService.createNewTeam(new CreateTeamDto(name, description, avatar), req.user!.user_id);
        if (team.id === 0) { res.status(503).json({ success: false, message: "No database node available" }); return; }
        res.status(201).json({ success: true, message: "Team created successfully", data: team });
    }

    private async getById(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id as string, 10);
        if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid ID" }); return; }
        const team = await this.teamReadService.getWithTeamId(id, req.user!.user_id, req.user?.role === UserRole.ADMIN);
        if (team.id === 0) { res.status(404).json({ success: false, message: "Team not found" }); return; }
        res.status(200).json({ success: true, data: team });
    }

    private async update(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id as string, 10);
        if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid ID" }); return; }
        const dto = req.body as UpdateTeamDto;
        const error = validateUpdateTeam(dto);
        if (error) { res.status(400).json({ success: false, message: error.message }); return; }
        const result = await this.teamWriteService.updateTeam(id, dto, req.user!.user_id, req.user?.role === UserRole.ADMIN);
        if (result === TeamOperationResult.Forbidden) { res.status(403).json({ success: false, message: "Only the team owner or an admin can update the team" }); return; }
        if (result === TeamOperationResult.NotFound) { res.status(404).json({ success: false, message: "Team not found" }); return; }
        await this.auditService.log(req.user!.user_id, AuditAction.UPDATE, "team", id, undefined, req.ip, req.user!.username);
        res.status(200).json({ success: true, message: "Team updated successfully" });
    }

    private async delete(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id as string, 10);
        if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid team ID" }); return; }
        const result = await this.teamWriteService.deleteTeam(id, req.user!.user_id, req.user?.role === UserRole.ADMIN);
        if (result === TeamOperationResult.Forbidden) { res.status(403).json({ success: false, message: "Only the team owner or an admin can delete the team" }); return; }
        if (result === TeamOperationResult.NotFound) { res.status(404).json({ success: false, message: "Team not found" }); return; }
        await this.auditService.log(req.user!.user_id, AuditAction.DELETE, "team", id, undefined, req.ip, req.user!.username);
        res.status(200).json({ success: true, message: "Team deleted successfully" });
    }

      private async getMembers(req: Request, res: Response): Promise<void> {
          const id = parseInt(req.params.id as string, 10);
          if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid ID" }); return; }
          const team = await this.teamReadService.getWithTeamId(id, req.user!.user_id, req.user?.role === UserRole.ADMIN);
          if (team.id === 0) { res.status(404).json({ success: false, message: "Team not found" }); return; }
          const { page, limit } = parsePagination(req.query as Record<string, string | number | boolean | null | undefined>);
          const result = await this.teamReadService.getTeamMembers(id, page, limit, req.user!.user_id);
          res.status(200).json({ success: true, data: result });
      }

    private async addMember(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id as string, 10);
        if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid member ID" }); return; }
        const { username, role } = req.body as { username?: string; role?: TeamMemberRole };
        if (!username) { res.status(400).json({ success: false, message: "Username is required" }); return; }
        const result = await this.teamMemberService.addTeamMember(id, new AddMemberDto(username, role ?? TeamMemberRole.MEMBER), req.user!.user_id, req.user?.role === UserRole.ADMIN);
        if (result === TeamOperationResult.Forbidden) { res.status(403).json({ success: false, message: "Only the team owner or an admin can add members" }); return; }
        if (result === TeamOperationResult.NotFound) { res.status(404).json({ success: false, message: "User not found" }); return; }
        await this.auditService.log(req.user!.user_id, AuditAction.CREATE, "team_member", id, `username=${username}`, req.ip, req.user!.username);
        res.status(201).json({ success: true, message: "Member added successfully" });
    }

    private async updateMemberRole(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id as string, 10);
        const memberId = parseInt(req.params.userId as string, 10);
        if (isNaN(id) || isNaN(memberId)) { res.status(400).json({ success: false, message: "Invalid IDs" }); return; }

        const { role } = req.body as UpdateMemberRoleDto;
        const error = validateMemberRole(role);
        if (error) { res.status(400).json({ success: false, message: error.message }); return; }

        const result = await this.teamMemberService.updateMemberRole(id, memberId, new UpdateMemberRoleDto(role), req.user!.user_id, req.user?.role === UserRole.ADMIN);
        if (result === UpdateRoleResult.Forbidden) { res.status(403).json({ success: false, message: "Only the team owner or an admin can change member roles" }); return; }
        if (result === UpdateRoleResult.NotFound)  { res.status(404).json({ success: false, message: "Member not found" }); return; }
        if (result === UpdateRoleResult.LastOwner) { res.status(400).json({ success: false, message: "A team must have exactly one owner" }); return; }
        await this.auditService.log(req.user!.user_id, AuditAction.UPDATE, "team_member", memberId, `role=${role}`, req.ip, req.user!.username);
        res.status(200).json({ success: true, message: "Role changed successfully" });
    }

      private async removeMember(req: Request, res: Response): Promise<void> {
          const id = parseInt(req.params.id as string, 10);
          const memberId = parseInt(req.params.userId as string, 10);
          if (isNaN(id) || isNaN(memberId)) { res.status(400).json({ success: false, message: "Invalid IDs" }); return; }
          const result = await this.teamMemberService.removeTeamMember(id, memberId, req.user!.user_id, req.user?.role === UserRole.ADMIN);
          if (result === TeamOperationResult.Forbidden) { res.status(403).json({ success: false, message: "Only the team owner or an admin can remove members other than themselves" }); return; }
          if (result === TeamOperationResult.LastOwner) { res.status(400).json({ success: false, message: "Cannot remove the last owner of a team" }); return; }
          if (result === TeamOperationResult.NotFound)  { res.status(404).json({ success: false, message: "Member not found" }); return; }
          await this.auditService.log(req.user!.user_id, AuditAction.DELETE, "team_member", memberId, undefined, req.ip, req.user!.username);
          res.status(200).json({ success: true, message: "Member removed successfully" });
      }
}
