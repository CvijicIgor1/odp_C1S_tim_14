import { Request, Response, Router } from "express";
import { ITeamService } from "../../Domain/services/teams/ITeamService";
import { authenticate } from "../../Middlewares/authentification/AuthMiddleware";
import { authorize } from '../../Middlewares/authorization/AuthorizeMiddleware';
import { UserRole } from "../../Domain/enums/UserRole";
import { TeamMemberRole } from "../../Domain/enums/TeamMemberRole";
import { CreateTeamDto } from "../../Domain/DTOs/teams/CreateTeamDto";
import { AddMemberDto } from "../../Domain/DTOs/teams/AddMemberDto";
import { UpdateMemberRoleDto } from "../../Domain/DTOs/teams/UpdateMemberRoleDto";
import { UpdateTeamDto } from "../../Domain/DTOs/teams/UpdateTeamDto";

export class TeamController {
    private readonly router = Router();
    public constructor(private readonly teamService: ITeamService) { // treba i private readonly IAuditService kad se doda
        this.router.get("/teams", authenticate, this.getAll.bind(this));
        this.router.get("/teams/all", authenticate, authorize(UserRole.ADMIN), this.getAllAsAdmin.bind(this));
        this.router.post("/teams", authenticate, this.create.bind(this));
        this.router.get("/teams/:id", authenticate, this.getById.bind(this));
        this.router.put("/teams/:id", authenticate, this.update.bind(this));
        this.router.delete("/teams/:id", authenticate, this.delete.bind(this));
        this.router.post("/teams/:id/members", authenticate, this.addMember.bind(this));
        this.router.patch("/teams/:id/members/:userId/role", authenticate, this.updateMemberRole.bind(this));
        this.router.delete("/teams/:id/members/:userId", authenticate, this.removeMember.bind(this));
    }

    public getRouter(): Router { return this.router; }

    private async getAll(req: Request, res: Response): Promise<void> { //za korisnika, samo njegovi timovi se vide.
        const page = parseInt(String(req.query.page ?? "1"), 10);
        const limit = Math.min(parseInt(String(req.query.limit ?? "20"), 10), 100);
        const result = await this.teamService.getAll(req.user!.user_id, page, limit);
        res.status(200).json({ success: true, data: result });
    }

    private async getAllAsAdmin(req: Request, res: Response): Promise<void> {  //admin vidi sve timove generalno, fali mi u servisu i repou (TODO)
        const page = parseInt(String(req.query.page ?? "1"), 10);
        const limit = Math.min(parseInt(String(req.query.limit ?? "20"), 10), 100);
        const result = await this.teamService.getAllAsAdmin(req.user!.user_id, page, limit, req.user?.role === UserRole.ADMIN);
        res.status(200).json({ success: true, data: result });
    }

    private async create(req: Request, res: Response): Promise<void> {
        const { name, description, avatar } = req.body as CreateTeamDto;
        if (!name || !description || !avatar) {
            res.status(400).json({ success: false, message: "All fields are mandatory (name, description, avatar)" });
            return;
        }
        const team = await this.teamService.createNewTeam(new CreateTeamDto(name, description, avatar), req.user!.user_id);
        if (team.id === 0) { res.status(503).json({ success: false, message: "No database node available" }); return; }
        res.status(201).json({ success: true, message: "Team created successfully", data: team });
    }

    private async getById(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id as string, 10);
        if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid ID" }); return; }
        const team = await this.teamService.getWithTeamId(id, req.user!.user_id, req.user?.role === UserRole.ADMIN);
        if (team.id === 0) { res.status(404).json({ success: false, message: "Team not found" }); return; }
        res.status(200).json({ success: true, data: team });
    }

    private async update(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id as string, 10);
        if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid ID" }); return; }
        const dto = req.body as UpdateTeamDto;
        const ok = await this.teamService.updateTeam(id, dto, req.user!.user_id);
        if (!ok) { res.status(404).json({ success: false, message: "Team not found"}); return; }
        res.status(200).json({ success: true, message: "Team updated successfully" });
    }

    private async delete(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id as string, 10);
        if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid team ID" }); return; }
        const ok = await this.teamService.deleteTeam(id, req.user!.user_id);
        if (!ok) { res.status(404).json({ success: false, message: "Team not found" }); return; }
        res.status(200).json({ success: true, message: "Team deleted successfully" });
    }

    private async addMember(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id as string, 10);
        if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid member ID" }); return; }
        const { username, role } = req.body as { username?: string; role?: TeamMemberRole };
        if (!username) { res.status(400).json({ success: false, message: "Username is required" }); return; }
        const ok = await this.teamService.addTeamMember(id, new AddMemberDto(username, role ?? TeamMemberRole.MEMBER), req.user!.user_id);
        if (!ok) { res.status(404).json({ success: false, message: "User not found" }); return; }
        res.status(201).json({ success: true, message: "Member added successfully" });
    }

    private async updateMemberRole(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id as string, 10);
        const memberId = parseInt(req.params.userId as string, 10);
        if (isNaN(id) || isNaN(memberId)) { res.status(400).json({ success: false, message: "Invalid IDs" }); return; }
        const { role } = req.body as UpdateMemberRoleDto;
        if (!role || (role !== "owner" && role !== "member")) {
            res.status(400).json({ success: false, message: "Role must be 'owner' or 'member'" }); return;
        }
        const ok = await this.teamService.updateMemberRole(id, memberId, new UpdateMemberRoleDto(role), req.user!.user_id);
        if (!ok) { res.status(404).json({ success: false, message: "Member not found" }); return; }
        res.status(200).json({ success: true, message: "Role changed successfully" });
    }

    private async removeMember(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id as string, 10);
        const memberId = parseInt(req.params.userId as string, 10);
        if (isNaN(id) || isNaN(memberId)) { res.status(400).json({ success: false, message: "Invalid IDs" }); return; }
        const ok = await this.teamService.removeTeamMember(id, memberId, req.user!.user_id);
        if (!ok) { res.status(404).json({ success: false, message: "Member not found" }); return; }
        res.status(200).json({ success: true, message: "Member removed successfully" });
    }
}