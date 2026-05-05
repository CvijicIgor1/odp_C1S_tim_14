import { Request, Response, Router } from "express";
import { ITaskService } from "../../Domain/services/tasks/ITaskService";
import { IAuditService } from "../../Domain/services/audit/IAuditService";
import { AuditAction } from "../../Domain/enums/AuditLog";
import { authenticate } from "../../Middlewares/authentification/AuthMiddleware";
import { UserRole } from "../../Domain/enums/UserRole";
import { TaskStatus } from "../../Domain/enums/TaskStatus";
import { Priority } from "../../Domain/enums/Priority";
import { CreateTaskDto } from "../../Domain/DTOs/tasks/CreateTaskDto";
import { UpdateTaskDto } from "../../Domain/DTOs/tasks/UpdateTaskDto";
import { UpdateTaskStatusDto } from "../../Domain/DTOs/tasks/UpdateTaskStatusDto";
import { AddTaskAssigneeDto } from "../../Domain/DTOs/tasks/AddTaskAssigneeDto";
import { AddCommentDto } from "../../Domain/DTOs/tasks/AddCommentDto";
import { MIN_TASK_TITLE_LENGTH, MAX_TASK_TITLE_LENGTH, MIN_ESTIMATED_HOURS, MAX_ESTIMATED_HOURS, MIN_COMMENT_LENGTH, MAX_COMMENT_LENGTH } from "../../Domain/constants/TaskConstants";

export class TaskController {
    private readonly router = Router();

    public constructor(
        private readonly taskService: ITaskService,
        private readonly auditService: IAuditService,
    ) {
        this.router.get("/tasks/project/:projectId", authenticate, this.getByProjectId.bind(this));
        this.router.post("/tasks",                   authenticate, this.create.bind(this));
        this.router.get("/tasks/:id",                authenticate, this.getById.bind(this));
        this.router.put("/tasks/:id",                authenticate, this.update.bind(this));
        this.router.patch("/tasks/:id/status",       authenticate, this.updateStatus.bind(this));
        this.router.delete("/tasks/:id",             authenticate, this.delete.bind(this));
        this.router.post("/tasks/:id/assignees",            authenticate, this.addAssignee.bind(this));
        this.router.delete("/tasks/:id/assignees/:userId",  authenticate, this.removeAssignee.bind(this));
        this.router.post("/tasks/:id/comments",             authenticate, this.addComment.bind(this));
        this.router.delete("/tasks/:id/comments/:commentId",authenticate, this.deleteComment.bind(this));
    }

    private async getByProjectId(req: Request, res: Response): Promise<void> {
        const projectId = parseInt(req.params.projectId, 10);
        if (isNaN(projectId)) { res.status(400).json({ success: false, message: "Invalid project ID" }); return; }

        const isAdmin = req.user?.role === UserRole.ADMIN;
        const result = await this.taskService.getByProjectId(projectId, req.user!.id, isAdmin);
        res.status(200).json({ success: true, data: result });
    }

    private async create(req: Request, res: Response): Promise<void> {
        const { projectId, title, description, status, priority, deadline, estimatedHours } =
            req.body as {
                projectId?: number; title?: string; description?: string;
                status?: string; priority?: string; deadline?: string; estimatedHours?: number;
            };

        if (!projectId || isNaN(Number(projectId))) { res.status(400).json({ success: false, message: "Invalid project ID" }); return; }
        if (!title || title.trim().length < MIN_TASK_TITLE_LENGTH || title.trim().length > MAX_TASK_TITLE_LENGTH) { res.status(400).json({ success: false, message: `Naslov zadatka je obavezan (${MIN_TASK_TITLE_LENGTH}–${MAX_TASK_TITLE_LENGTH} karaktera)` }); return; }
        if (!priority || !Object.values(Priority).includes(priority as Priority)) { res.status(400).json({ success: false, message: "Izaberite validan prioritet" }); return; }
        if (!status || !Object.values(TaskStatus).includes(status as TaskStatus)) { res.status(400).json({ success: false, message: "Izaberite validan status" }); return; }

        const hours = parseFloat(String(estimatedHours));
        if (isNaN(hours) || hours < MIN_ESTIMATED_HOURS || hours > MAX_ESTIMATED_HOURS) {
            res.status(400).json({ success: false, message: `Procena mora biti između ${MIN_ESTIMATED_HOURS} i ${MAX_ESTIMATED_HOURS} sati` }); return;
        }

        const deadlineDate = deadline ? new Date(deadline) : null;
        if (!deadlineDate || isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
            res.status(400).json({ success: false, message: "Rok mora biti u budućnosti" }); return;
        }

        const dto = new CreateTaskDto(
            Number(projectId), title.trim(), description ?? "",
            status as TaskStatus, priority as Priority, deadlineDate, hours
        );

        const task = await this.taskService.createTask(dto, req.user!.id);
        if (task.id === 0) { res.status(503).json({ success: false, message: "Failed to create task" }); return; }

        await this.auditService.log(req.user!.id, AuditAction.TASK_CREATED, "tasks", task.id, `title: ${title}`, req.ip);
        res.status(201).json({ success: true, message: "Task created successfully", data: task });
    }

    private async getById(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid ID" }); return; }

        const isAdmin = req.user?.role === UserRole.ADMIN;
        const task = await this.taskService.getById(id, req.user!.id, isAdmin);
        if (task.task.id === 0) { res.status(404).json({ success: false, message: "Task not found" }); return; }
        res.status(200).json({ success: true, data: task });
    }

    private async update(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid ID" }); return; }

        const { title, description, priority, deadline, estimatedHours } =
            req.body as { title?: string; description?: string; priority?: string; deadline?: string; estimatedHours?: number; };

        if (title !== undefined && (title.trim().length < MIN_TASK_TITLE_LENGTH || title.trim().length > MAX_TASK_TITLE_LENGTH)) {
            res.status(400).json({ success: false, message: `Naslov zadatka je obavezan (${MIN_TASK_TITLE_LENGTH}–${MAX_TASK_TITLE_LENGTH} karaktera)` }); return;
        }
        if (priority !== undefined && !Object.values(Priority).includes(priority as Priority)) {
            res.status(400).json({ success: false, message: "Izaberite validan prioritet" }); return;
        }
        if (estimatedHours !== undefined) {
            const hours = parseFloat(String(estimatedHours));
            if (isNaN(hours) || hours < MIN_ESTIMATED_HOURS || hours > MAX_ESTIMATED_HOURS) {
                res.status(400).json({ success: false, message: `Procena mora biti između ${MIN_ESTIMATED_HOURS} i ${MAX_ESTIMATED_HOURS} sati` }); return;
            }
        }
        if (deadline !== undefined) {
            const d = new Date(deadline);
            if (isNaN(d.getTime()) || d <= new Date()) { res.status(400).json({ success: false, message: "Rok mora biti u budućnosti" }); return; }
        }

        const dto = new UpdateTaskDto(
            title?.trim(), description, priority as Priority | undefined,
            deadline ? new Date(deadline) : undefined,
            estimatedHours !== undefined ? parseFloat(String(estimatedHours)) : undefined
        );

        const ok = await this.taskService.updateTask(id, dto, req.user!.id);
        if (!ok) { res.status(404).json({ success: false, message: "Task not found or insufficient permissions" }); return; }

        await this.auditService.log(req.user!.id, AuditAction.TASK_UPDATED, "tasks", id, undefined, req.ip);
        res.status(200).json({ success: true, message: "Task updated successfully" });
    }

    private async updateStatus(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id, 10);
        const { status } = req.body as { status?: string };

        if (isNaN(id) || !status || !Object.values(TaskStatus).includes(status as TaskStatus)) {
            res.status(400).json({ success: false, message: "Invalid parameters" }); return;
        }

        const dto = new UpdateTaskStatusDto(status as TaskStatus);
        const ok = await this.taskService.updateTaskStatus(id, dto, req.user!.id);
        if (!ok) { res.status(404).json({ success: false, message: "Task not found or insufficient permissions" }); return; }

        await this.auditService.log(req.user!.id, AuditAction.TASK_STATUS_UPDATED, "tasks", id, `status: ${status}`, req.ip);
        res.status(200).json({ success: true, message: "Status updated" });
    }

    private async delete(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid ID" }); return; }

        const ok = await this.taskService.deleteTask(id, req.user!.id);
        if (!ok) { res.status(404).json({ success: false, message: "Task not found or insufficient permissions" }); return; }

        await this.auditService.log(req.user!.id, AuditAction.TASK_DELETED, "tasks", id, undefined, req.ip);
        res.status(200).json({ success: true, message: "Task deleted successfully" });
    }

    private async addAssignee(req: Request, res: Response): Promise<void> {
        const taskId = parseInt(req.params.id, 10);
        const { userId } = req.body as { userId?: number };

        if (isNaN(taskId) || !userId || isNaN(Number(userId))) {
            res.status(400).json({ success: false, message: "Invalid parameters" }); return;
        }

        const dto = new AddTaskAssigneeDto(Number(userId));
        const ok = await this.taskService.addAssignee(taskId, dto, req.user!.id);
        if (!ok) { res.status(400).json({ success: false, message: "Korisnik nije član ovog tima ili je već dodat" }); return; }

        await this.auditService.log(req.user!.id, AuditAction.TASK_ASSIGNEE_ADDED, "task_assignees", taskId, `assignedUserId: ${userId}`, req.ip);
        res.status(200).json({ success: true, message: "Assignee added successfully" });
    }

    private async removeAssignee(req: Request, res: Response): Promise<void> {
        const taskId = parseInt(req.params.id, 10);
        const userId = parseInt(req.params.userId, 10);

        if (isNaN(taskId) || isNaN(userId)) { res.status(400).json({ success: false, message: "Invalid parameters" }); return; }

        const ok = await this.taskService.removeAssignee(taskId, userId, req.user!.id);
        if (!ok) { res.status(404).json({ success: false, message: "Assignee not found" }); return; }

        await this.auditService.log(req.user!.id, AuditAction.TASK_ASSIGNEE_REMOVED, "task_assignees", taskId, `removedUserId: ${userId}`, req.ip);
        res.status(200).json({ success: true, message: "Assignee removed successfully" });
    }

    private async addComment(req: Request, res: Response): Promise<void> {
        const taskId = parseInt(req.params.id, 10);
        const { content } = req.body as { content?: string };

        if (isNaN(taskId)) { res.status(400).json({ success: false, message: "Invalid task ID" }); return; }
        if (!content || content.trim().length < MIN_COMMENT_LENGTH || content.trim().length > MAX_COMMENT_LENGTH) {
            res.status(400).json({ success: false, message: `Komentar ne može biti prazan (max ${MAX_COMMENT_LENGTH} karaktera)` }); return;
        }

        const dto = new AddCommentDto(content.trim());
        const comment = await this.taskService.addComment(taskId, dto, req.user!.id);
        if (comment.id === 0) { res.status(400).json({ success: false, message: "Failed to add comment or insufficient permissions" }); return; }

        await this.auditService.log(req.user!.id, AuditAction.COMMENT_ADDED, "comments", comment.id, `taskId: ${taskId}`, req.ip);
        res.status(201).json({ success: true, message: "Comment added successfully", data: comment });
    }

    private async deleteComment(req: Request, res: Response): Promise<void> {
        const commentId = parseInt(req.params.commentId, 10);
        if (isNaN(commentId)) { res.status(400).json({ success: false, message: "Invalid comment ID" }); return; }

        const ok = await this.taskService.deleteComment(commentId, req.user!.id);
        if (!ok) { res.status(404).json({ success: false, message: "Comment not found or insufficient permissions" }); return; }

        await this.auditService.log(req.user!.id, AuditAction.COMMENT_DELETED, "comments", commentId, undefined, req.ip);
        res.status(200).json({ success: true, message: "Comment deleted successfully" });
    }

    public getRouter(): Router { return this.router; }
}