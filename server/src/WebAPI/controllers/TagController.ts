import { Router, Request, Response } from "express";
import { ITagService } from "../../Domain/services/tags/ITagService";
import { authenticate } from "../../Middlewares/authentification/AuthMiddleware";
import { authorize } from "../../Middlewares/authorization/AuthorizeMiddleware";
import { UserRole } from "../../Domain/enums/UserRole";
import { CreateTagDto } from "../../Domain/DTOs/tags/CreateTagDto";

export class TagController {
    private readonly router = Router();

    public getRouter(): Router { return this.router; }

    public constructor(private readonly tagService: ITagService){
        this.router.get("/tags", authenticate, this.getAllTags.bind(this));
        this.router.post("/tags", authenticate, authorize(UserRole.ADMIN), this.createNewTag.bind(this));
        this.router.delete("/tags/:id", authenticate, authorize(UserRole.ADMIN), this.deleteTag.bind(this));
    }

    private async getAllTags(req: Request, res: Response): Promise<void>{
        const page = parseInt(String(req.query.page ?? "1"), 10);
        const limit = Math.min(parseInt(String(req.query.limit ?? "20"), 10), 100);
        const result = await this.tagService.getAll(page, limit);
        res.status(200).json({success: true, data: result});
    }

    private async createNewTag(req: Request, res: Response): Promise<void> {
        const { name } = req.body as CreateTagDto;
        if (!name) { res.status(400).json({ success: false, message: "Name is required" }); return; }
        const tag = await this.tagService.create(new CreateTagDto(name));
        if (tag.id === 0) { res.status(503).json({ success: false, message: "No database node available" }); return; }
        res.status(201).json({ success: true, message: "Tag created successfully", data: tag });
    }

    private async deleteTag(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id as string, 10);
        if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid ID of the tag" }); return; }
        const ok = await this.tagService.delete(id);
        if (!ok) { res.status(404).json({ success: false, message: "Tag not found" }); return; }
        res.status(200).json({ success: true, message: "Tag deleted successfully" });
    }
}   