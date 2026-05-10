import { Request, Response, Router } from "express";
import { ITaskService } from "../../Domain/services/tasks/ITaskService";
import { IAuditService } from "../../Domain/services/audit/IAuditService";
import { authenticate } from "../../Middlewares/authentification/AuthMiddleware";
import { UserRole } from "../../Domain/enums/UserRole";
import { AuditAction } from "../../Domain/enums/AuditLog";
import { CreateTaskDto } from "../../Domain/DTOs/tasks/CreateTaskDto";
import { UpdateTaskDto } from "../../Domain/DTOs/tasks/UpdateTaskDto";
import { UpdateTaskStatusDto } from "../../Domain/DTOs/tasks/UpdateTaskStatusDto";
import { AddTaskAssigneeDto } from "../../Domain/DTOs/tasks/AddTaskAssigneeDto";
import { AddCommentDto } from "../../Domain/DTOs/tasks/AddCommentDto";
import { TASK_TITLE_MIN, TASK_TITLE_MAX } from "../../Domain/constants/Constants";

const ESTIMATED_HOURS_MIN = 0.5;
const ESTIMATED_HOURS_MAX = 500;
const COMMENT_MAX_LENGTH  = 2000;

export class TaskController {
    private readonly router = Router();

    public constructor(private readonly taskService: ITaskService, private readonly auditService: IAuditService) {
        this.router.get("/projects/:projectId/tasks", authenticate, this.getByProject.bind(this));
        this.router.post("/projects/:projectId/tasks", authenticate, this.create.bind(this));
        this.router.get("/tasks/my", authenticate, this.getMyTasks.bind(this));
        this.router.get("/tasks/:id", authenticate, this.getById.bind(this));
        this.router.put("/tasks/:id", authenticate, this.update.bind(this));
        this.router.patch("/tasks/:id/status", authenticate, this.updateStatus.bind(this));
        this.router.delete("/tasks/:id", authenticate, this.delete.bind(this));
        this.router.post("/tasks/:id/assignees", authenticate, this.addAssignee.bind(this));
        this.router.delete("/tasks/:id/assignees/:userId", authenticate, this.removeAssignee.bind(this));
        this.router.post("/tasks/:id/comments", authenticate, this.addComment.bind(this));
        this.router.delete("/tasks/:id/comments/:commentId", authenticate, this.deleteComment.bind(this));
    }

    public getRouter(): Router { return this.router; }


    private async getByProject(req: Request, res: Response): Promise<void>
    {
        const projectId = parseInt(String(req.params.projectId), 10);
        if (isNaN(projectId)) { res.status(400).json({ success: false, message: "Invalid project ID" }); return; }

        const isAdmin = req.user?.role === UserRole.ADMIN;

        const result = await this.taskService.getByProjectId(projectId, req.user!.user_id, isAdmin);
        res.status(200).json({ success: true, data: result });
    }


    private async getMyTasks(req: Request, res: Response): Promise<void>
    {
        const tasks = await this.taskService.getMyTasks(req.user!.user_id);
        res.status(200).json({ success: true, data: tasks });
    }


    private async getById(req: Request, res: Response): Promise<void>
    {
        const id = parseInt(String(req.params.id), 10);
        if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid task ID" }); return; }

        const isAdmin = req.user?.role === UserRole.ADMIN;

        const task = await this.taskService.getById(id, req.user!.user_id, isAdmin);
        if (!task.task || task.task.id === 0) { res.status(404).json({ success: false, message: "Task not found" }); return; }

        res.status(200).json({ success: true, data: task });
    }


    private async create(req: Request, res: Response): Promise<void>
    {
        const projectId = parseInt(String(req.params.projectId), 10);
        if (isNaN(projectId)) { res.status(400).json({ success: false, message: "Invalid project ID" }); return; }

        const { title, description, status, priority, deadline, estimatedHours } = req.body;
        if (!title || !description || !deadline) {
            res.status(400).json({ success: false, message: "title, description and deadline are required" });
            return;
        }

        const hours = Number(estimatedHours ?? 0);
        if (isNaN(hours) || hours < ESTIMATED_HOURS_MIN || hours > ESTIMATED_HOURS_MAX) {
            res.status(400).json({ success: false, message: `estimated_hours must be between ${ESTIMATED_HOURS_MIN} and ${ESTIMATED_HOURS_MAX}` }); return;
        }

        const dto = new CreateTaskDto(projectId, title, description, status, priority, deadline, hours);
        const task = await this.taskService.createTask(dto, req.user!.user_id);

        if (task.id === 0) { res.status(503).json({ success: false, message: "No database node available" }); return; }
        await this.auditService.log(req.user!.user_id, AuditAction.CREATE, "task", task.id, undefined, req.ip);
        res.status(201).json({ success: true, message: "Task created successfully", data: task });
    }


    private async update(req: Request, res: Response): Promise<void>
    {
        const id = parseInt(String(req.params.id), 10);
        if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid task ID" }); return; }

        const dto = req.body as UpdateTaskDto;
        if (dto.title !== undefined && (dto.title.length < TASK_TITLE_MIN || dto.title.length > TASK_TITLE_MAX)) {
            res.status(400).json({ success: false, message: `Task title must be between ${TASK_TITLE_MIN} and ${TASK_TITLE_MAX} characters` }); return;
        }

        if (dto.estimatedHours !== undefined) {
            const hours = Number(dto.estimatedHours);
            if (isNaN(hours) || hours < ESTIMATED_HOURS_MIN || hours > ESTIMATED_HOURS_MAX) {
                res.status(400).json({ success: false, message: `estimated_hours must be between ${ESTIMATED_HOURS_MIN} and ${ESTIMATED_HOURS_MAX}` }); return;
            }
        }

        const ok = await this.taskService.updateTask(id, dto, req.user!.user_id);
        if (!ok) { res.status(404).json({ success: false, message: "Task not found or forbidden" }); return; }
        await this.auditService.log(req.user!.user_id, AuditAction.UPDATE, "task", id, undefined, req.ip);
        res.status(200).json({ success: true, message: "Task updated successfully" });
    }


    private async updateStatus(req: Request, res: Response): Promise<void>
    {
        const id = parseInt(String(req.params.id), 10);
        if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid task ID" }); return; }

        const dto = req.body as UpdateTaskStatusDto;

        const ok = await this.taskService.updateTaskStatus(id, dto, req.user!.user_id);
        if (!ok) { res.status(404).json({ success: false, message: "Task not found or forbidden" }); return; }
        await this.auditService.log(req.user!.user_id, AuditAction.UPDATE, "task", id, `status:${dto.status}`, req.ip);
        res.status(200).json({ success: true, message: "Task status updated successfully" });
    }


    private async delete(req: Request, res: Response): Promise<void>
    {
        const id = parseInt(String(req.params.id), 10);
        if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid task ID" }); return; }

        const ok = await this.taskService.deleteTask(id, req.user!.user_id);
        if (!ok) { res.status(404).json({ success: false, message: "Task not found or forbidden" }); return; }
        await this.auditService.log(req.user!.user_id, AuditAction.DELETE, "task", id, undefined, req.ip);
        res.status(200).json({ success: true, message: "Task deleted successfully" });
    }


    private async addAssignee(req: Request, res: Response): Promise<void>
    {
        const id = parseInt(String(req.params.id), 10);
        if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid task ID" }); return; }

        const dto = req.body as AddTaskAssigneeDto;
        if (!dto.userId) { res.status(400).json({ success: false, message: "userId is required" }); return; }

        const ok = await this.taskService.addAssignee(id, dto, req.user!.user_id);
        if (!ok) { res.status(400).json({ success: false, message: "Cannot assign user: not a team member or already assigned" }); return; }
        await this.auditService.log(req.user!.user_id, AuditAction.UPDATE, "task", id, `assignee:${dto.userId}`, req.ip);
        res.status(200).json({ success: true, message: "Assignee added successfully" });
    }


    private async removeAssignee(req: Request, res: Response): Promise<void>
    {
        const id     = parseInt(String(req.params.id),     10);
        const userId = parseInt(String(req.params.userId), 10);
        if (isNaN(id) || isNaN(userId)) { res.status(400).json({ success: false, message: "Invalid IDs" }); return; }

        const ok = await this.taskService.removeAssignee(id, userId, req.user!.user_id);
        if (!ok) { res.status(404).json({ success: false, message: "Assignee not found" }); return; }
        await this.auditService.log(req.user!.user_id, AuditAction.UPDATE, "task", id, `assignee_removed:${userId}`, req.ip);
        res.status(200).json({ success: true, message: "Assignee removed successfully" });
    }


    private async addComment(req: Request, res: Response): Promise<void>
    {
        const id = parseInt(String(req.params.id), 10);
        if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid task ID" }); return; }

        const dto = req.body as AddCommentDto;
        if (!dto.content || dto.content.trim().length === 0) {
            res.status(400).json({ success: false, message: "content is required" }); return;
        }
        if (dto.content.length > COMMENT_MAX_LENGTH) {
            res.status(400).json({ success: false, message: `Comment cannot exceed ${COMMENT_MAX_LENGTH} characters` }); return;
        }

        const comment = await this.taskService.addComment(id, dto, req.user!.user_id);
        if (comment === null) { res.status(404).json({ success: false, message: "Task not found" }); return; }
        if (comment.id === 0) { res.status(403).json({ success: false, message: "You are not authorized to comment on this task" }); return; }
        res.status(201).json({ success: true, message: "Comment added successfully", data: comment });
    }


    private async deleteComment(req: Request, res: Response): Promise<void>
    {
        const commentId = parseInt(String(req.params.commentId), 10);
        if (isNaN(commentId)) { res.status(400).json({ success: false, message: "Invalid comment ID" }); return; }

        const ok = await this.taskService.deleteComment(commentId, req.user!.user_id);
        if (!ok) { res.status(404).json({ success: false, message: "Comment not found or forbidden" }); return; }
        res.status(200).json({ success: true, message: "Comment deleted successfully" });
    }
}
