import { Request, Response, Router } from "express";
import { ITeamService } from "../../Domain/services/teams/ITeamService";
import { authenticate } from "../../Middlewares/authentification/AuthMiddleware";
import { authorize } from '../../Middlewares/authorization/AuthorizeMiddleware';
import { UserRole } from "../../Domain/enums/UserRole";

export class TeamController {
    private readonly router = Router();
    public constructor(private readonly teamService: ITeamService) { // treba i private readonly IAuditService kad se doda
        this.router.get("/teams", authenticate, this.getAll.bind(this));
        this.router.get("/teams/all", authenticate, authorize(UserRole.ADMIN), this.getAllAdmin.bind(this));
        this.router.post("/teams", authenticate, this.create.bind(this));
        this.router.get("/teams/:id", authenticate, this.getById.bind(this));
        this.router.put("/teams/:id", authenticate, this.update.bind(this));
        this.router.delete("/teams/:id", authenticate, this.delete.bind(this));
        this.router.post("/teams/:id/members", authenticate, this.addMember.bind(this));
        this.router.patch("/teams/:id/members/:userId/role", authenticate, this.updateMemberRole.bind(this));
        this.router.delete("/teams/:id/members/:userId", authenticate, this.removeMember.bind(this));
    }

    public getRouter(): Router { return this.router; }

    private async getAll(req: Request, res: Response): Promise<void> {

    }

    private async getAllAdmin(req: Request, res: Response): Promise<void> {

    }

    private async create(req: Request, res: Response): Promise<void> {

    }

    private async getById(req: Request, res: Response): Promise<void> {

    }

    private async update(req: Request, res: Response): Promise<void> {

    }

    private async delete(req: Request, res: Response): Promise<void> {

    }

    private async addMember(req: Request, res: Response): Promise<void> {

    }

    private async updateMemberRole(req: Request, res: Response): Promise<void> {

    }

    private async removeMember(req: Request, res: Response): Promise<void> {

    }
}