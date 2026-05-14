import { Request, Response, Router } from "express";
import { IProjectReadService } from "../../Domain/services/projects/IProjectReadService";
import { IProjectWriteService } from "../../Domain/services/projects/IProjectWriteService";
import { IProjectTagWatchService } from "../../Domain/services/projects/IProjectTagWatchService";
import { IAuditService } from "../../Domain/services/audit/IAuditService";
import { authorize } from "../../Middlewares/authorization/AuthorizeMiddleware";
import { authenticate } from "../../Middlewares/authentification/AuthMiddleware";
import { UserRole } from "../../Domain/enums/UserRole";
import { AuditAction } from "../../Domain/enums/AuditLog";
import { AddTagResult } from "../../Domain/enums/AddTagResult";
import { CreateProjectDto } from "../../Domain/DTOs/projects/CreateProjectDto";
import { UpdateProjectDto } from "../../Domain/DTOs/projects/UpdateProjectDto";
import { ProjectStatus } from "../../Domain/enums/ProjectStatus";
import { Priority } from "../../Domain/enums/Priority";
import { PROJECT_NAME_MIN, PROJECT_NAME_MAX } from "../../Domain/constants/Constants";

export class ProjectController {
    private readonly router = Router();

    public constructor(
        private readonly projectReadService: IProjectReadService,
        private readonly projectWriteService: IProjectWriteService,
        private readonly projectTagWatchService: IProjectTagWatchService,
        private readonly auditService: IAuditService
    ) {
        this.router.get("/teams/:teamId/projects",      authenticate, this.getTeamProjects.bind(this));
        this.router.post("/teams/:teamId/projects",     authenticate, this.create.bind(this));
        this.router.get("/projects/all",          authenticate, authorize(UserRole.ADMIN), this.getAllAsAdmin.bind(this));
        this.router.get("/projects/watched",            authenticate, this.getWatched.bind(this)); // mora biti PRIJE /:id
        this.router.get("/projects/:id",                authenticate, this.getById.bind(this));
        this.router.put("/projects/:id",                authenticate, this.update.bind(this));
        this.router.delete("/projects/:id",             authenticate, this.delete.bind(this));
        this.router.post("/projects/:id/tags",          authenticate, this.addTag.bind(this));
        this.router.delete("/projects/:id/tags/:tagId", authenticate, this.removeTag.bind(this));
        this.router.post("/projects/:id/watch",         authenticate, this.watch.bind(this));
        this.router.delete("/projects/:id/watch",       authenticate, this.unwatch.bind(this));
    }

    public getRouter(): Router { return this.router; }

    
    private async getTeamProjects(req: Request, res: Response): Promise<void> 
    {
        const teamId = parseInt(String(req.params.teamId), 10);
        if (isNaN(teamId)) { res.status(400).json({ success: false, message: "Invalid team ID" }); return; }

        const page  = Math.max(1, parseInt(String(req.query.page  ?? "1"),  10));
        const limit = Math.min(parseInt(String(req.query.limit ?? "20"), 10), 100);

        const filters = {
            status:   req.query.status   ? String(req.query.status)   as ProjectStatus : undefined,
            priority: req.query.priority ? String(req.query.priority) as Priority      : undefined,
            tagId:    req.query.tagId    ? parseInt(String(req.query.tagId), 10)        : undefined,
        };

        const result = await this.projectReadService.getTeamProjects(teamId, req.user!.user_id, page, limit, filters);
        res.status(200).json({ success: true, data: result });
    }

    
    private async getAllAsAdmin(req: Request, res: Response): Promise<void> 
    {
        const page  = Math.max(1, parseInt(String(req.query.page  ?? "1"),  10));
        const limit = Math.min(parseInt(String(req.query.limit ?? "100"), 10), 200);

        const result = await this.projectReadService.getAllProjectsAsAdmin(page, limit);
        res.status(200).json({ success: true, data: result });
    }
    private async getWatched(req: Request, res: Response): Promise<void> 
    {
        const page  = Math.max(1, parseInt(String(req.query.page  ?? "1"),  10));
        const limit = Math.min(parseInt(String(req.query.limit ?? "20"), 10), 100);

        const result = await this.projectReadService.getWatchedProjects(req.user!.user_id, page, limit);
        res.status(200).json({ success: true, data: result });
    }

    
    private async getById(req: Request, res: Response): Promise<void> 
    {
        const id = parseInt(String(req.params.id), 10);
        if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid project ID" }); return; }

        const isAdmin = req.user?.role === UserRole.ADMIN;

        const project = await this.projectReadService.getProjectById(id, req.user!.user_id, isAdmin);
        if (project.id === 0) { res.status(404).json({ success: false, message: "Project not found" }); return; }

        res.status(200).json({ success: true, data: project });
    }

    
    private async create(req: Request, res: Response): Promise<void> 
    {
        const teamId = parseInt(String(req.params.teamId), 10);
        if (isNaN(teamId)) { res.status(400).json({ success: false, message: "Invalid team ID" }); return; }

        const { name, description, status, priority, deadline, tagIds } = req.body as CreateProjectDto;
        if (!name || !description || !deadline) {
            res.status(400).json({ success: false, message: "name, description and deadline are required" });
            return;
        }
        if (name.length < PROJECT_NAME_MIN || name.length > PROJECT_NAME_MAX) {
            res.status(400).json({ success: false, message: `Project name must be between ${PROJECT_NAME_MIN} and ${PROJECT_NAME_MAX} characters` });
            return;
        }
        if (new Date(deadline) <= new Date()) {
            res.status(400).json({ success: false, message: "Deadline must be a future date" }); return;
        }

        const dto = new CreateProjectDto(name, description, status, priority, deadline, tagIds ?? []);
        const project = await this.projectWriteService.createProject(teamId, dto, req.user!.user_id);

        if (project.id === 0) { res.status(503).json({ success: false, message: "No database node available" }); return; }
        await this.auditService.log(req.user!.user_id, AuditAction.CREATE, "project", project.id, undefined, req.ip, req.user!.username);
        res.status(201).json({ success: true, message: "Project created successfully", data: project });
    }

   
    private async update(req: Request, res: Response): Promise<void> 
    {
        const id = parseInt(String(req.params.id), 10);
        if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid project ID" }); return; }

        const dto = req.body as UpdateProjectDto;
        if (dto.name !== undefined && (dto.name.length < PROJECT_NAME_MIN || dto.name.length > PROJECT_NAME_MAX)) {
            res.status(400).json({ success: false, message: `Project name must be between ${PROJECT_NAME_MIN} and ${PROJECT_NAME_MAX} characters` });
            return;
        }
        if (dto.deadline && new Date(dto.deadline) <= new Date()) {
            res.status(400).json({ success: false, message: "Deadline must be a future date" }); return;
        }
        const isAdmin = req.user?.role === UserRole.ADMIN;

        const ok = await this.projectWriteService.updateProject(id, dto, req.user!.user_id, isAdmin);
        if (!ok) { res.status(404).json({ success: false, message: "Project not found or forbidden" }); return; }
        await this.auditService.log(req.user!.user_id, AuditAction.UPDATE, "project", id, undefined, req.ip, req.user!.username);
        res.status(200).json({ success: true, message: "Project updated successfully" });
    }

    
    private async delete(req: Request, res: Response): Promise<void> 
    {
        const id = parseInt(String(req.params.id), 10);
        if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid project ID" }); return; }

        const isAdmin = req.user?.role === UserRole.ADMIN;

        const ok = await this.projectWriteService.deleteProject(id, req.user!.user_id, isAdmin);
        if (!ok) { res.status(404).json({ success: false, message: "Project not found or forbidden" }); return; }
        await this.auditService.log(req.user!.user_id, AuditAction.DELETE, "project", id, undefined, req.ip, req.user!.username);
        res.status(200).json({ success: true, message: "Project deleted successfully" });
    }

    
    private async addTag(req: Request, res: Response): Promise<void> 
    {
        const id    = parseInt(String(req.params.id), 10);
        const tagId = parseInt(String(req.body.tagId), 10);
        if (isNaN(id) || isNaN(tagId)) { res.status(400).json({ success: false, message: "Invalid project ID or tagId" }); return; }

        const isAdmin = req.user?.role === UserRole.ADMIN;

        const result = await this.projectTagWatchService.addTag(id, tagId, req.user!.user_id, isAdmin);
        if (result === AddTagResult.FORBIDDEN)  { res.status(403).json({ success: false, message: "Not found or forbidden" }); return; }
        if (result === AddTagResult.DUPLICATE)  { res.status(409).json({ success: false, message: "Tag already added to this project" }); return; }
        await this.auditService.log(req.user!.user_id, AuditAction.UPDATE, "project", id, `tag:${tagId}`, req.ip, req.user!.username);
        res.status(200).json({ success: true, message: "Tag added successfully" });
    }

    
    private async removeTag(req: Request, res: Response): Promise<void> 
    {
        const id    = parseInt(String(req.params.id),    10);
        const tagId = parseInt(String(req.params.tagId), 10);
        if (isNaN(id) || isNaN(tagId)) { res.status(400).json({ success: false, message: "Invalid IDs" }); return; }

        const isAdmin = req.user?.role === UserRole.ADMIN;

        const ok = await this.projectTagWatchService.removeTag(id, tagId, req.user!.user_id, isAdmin);
        if (!ok) { res.status(404).json({ success: false, message: "Not found or forbidden" }); return; }
        await this.auditService.log(req.user!.user_id, AuditAction.UPDATE, "project", id, `tag:${tagId}`, req.ip, req.user!.username);
        res.status(200).json({ success: true, message: "Tag removed successfully" });
    }

    
    private async watch(req: Request, res: Response): Promise<void> 
    {
        const id = parseInt(String(req.params.id), 10);
        if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid project ID" }); return; }

        const ok = await this.projectTagWatchService.watchProject(id, req.user!.user_id);
        if (!ok) { res.status(403).json({ success: false, message: "You must be a team member to watch this project" }); return; }
        res.status(200).json({ success: true, message: "Now watching project" });
    }

   
    private async unwatch(req: Request, res: Response): Promise<void> 
    {
        const id = parseInt(String(req.params.id), 10);
        if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid project ID" }); return; }

        const ok = await this.projectTagWatchService.unwatchProject(id, req.user!.user_id);
        if (!ok) { res.status(404).json({ success: false, message: "You are not watching this project" }); return; }
        res.status(200).json({ success: true, message: "Stopped watching project" });
    }
}