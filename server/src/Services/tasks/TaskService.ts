import { ITaskService } from "../../Domain/services/tasks/ITaskService";
import { ITaskRepository } from "../../Domain/repositories/tasks/ITaskRepository";
import { TaskDto } from "../../Domain/DTOs/tasks/TaskDto";
import { TaskDetailDto } from "../../Domain/DTOs/tasks/TaskDetailDto";
import { CommentDto } from "../../Domain/DTOs/tasks/CommentDto";
import { TaskAssigneeDto } from "../../Domain/DTOs/tasks/TaskAssigneeDto";
import { GroupedTasksDto } from "../../Domain/DTOs/tasks/GroupedTasksDto";
import { CreateTaskDto } from "../../Domain/DTOs/tasks/CreateTaskDto";
import { UpdateTaskDto } from "../../Domain/DTOs/tasks/UpdateTaskDto";
import { UpdateTaskStatusDto } from "../../Domain/DTOs/tasks/UpdateTaskStatusDto";
import { AddTaskAssigneeDto } from "../../Domain/DTOs/tasks/AddTaskAssigneeDto";
import { AddCommentDto } from "../../Domain/DTOs/tasks/AddCommentDto";
import { Task } from "../../Domain/models/Task";
import { Comment } from "../../Domain/models/Comment";
import { TaskAssignee } from "../../Domain/models/TaskAssignee";

export class TaskService implements ITaskService
{
    public constructor(
        private readonly taskRepo: ITaskRepository,
    ) {}

    private toDto(task: Task): TaskDto
    {
        return new TaskDto(
            task.id,
            task.projectId,
            task.createdByUserId,
            task.title,
            task.description,
            task.status,
            task.priority,
            task.deadline,
            task.estimatedHours,
            task.createdAt,
            task.updatedAt,
        );
    }

    private toCommentDto(comment: Comment): CommentDto
    {
        return new CommentDto(
            comment.id,
            comment.taskId,
            comment.userId,
            comment.content,
            comment.createdAt,
        );
    }

    private toAssigneeDto(assignee: TaskAssignee): TaskAssigneeDto
    {
        return new TaskAssigneeDto(
            assignee.taskId,
            assignee.userId,
            assignee.assignedBy,
            assignee.assignedAt,
        );
    }

    async getByProjectId(
        projectId: number,
        userId: number,
        isAdmin: boolean,
    ): Promise<GroupedTasksDto>
    {
        const empty = new GroupedTasksDto([], [], []);

        const isMember = await this.taskRepo.isUserInProjectTeam(projectId, userId);
        if (!isAdmin && !isMember) return empty;

        const { todo, in_progress, done } = await this.taskRepo.findByProjectId(projectId);

        return new GroupedTasksDto(
            todo.map((t) => this.toDto(t)),
            in_progress.map((t) => this.toDto(t)),
            done.map((t) => this.toDto(t)),
        );
    }

    async getById(
        taskId: number,
        userId: number,
        isAdmin: boolean,
    ): Promise<TaskDetailDto>
    {
        const empty = new TaskDetailDto();

        const task = await this.taskRepo.findById(taskId);
        if (task.id === 0) return empty;

        const isMember = await this.taskRepo.isUserInProjectTeam(task.projectId, userId);
        if (!isAdmin && !isMember) return empty;

        const comments = await this.taskRepo.getComments(taskId);
        const assignees = await this.taskRepo.getAssignees(taskId);

        return new TaskDetailDto(
            this.toDto(task),
            comments.map((c) => this.toCommentDto(c)),
            assignees.map((a) => this.toAssigneeDto(a)),
        );
    }

    async createTask(dto: CreateTaskDto, userId: number): Promise<TaskDto>
    {
        const created = await this.taskRepo.create(dto, userId);
        if (created.id === 0) return new TaskDto();
        return this.toDto(created);
    }

    async updateTask(
        taskId: number,
        dto: UpdateTaskDto,
        userId: number,
    ): Promise<boolean>
    {
        const task = await this.taskRepo.findById(taskId);
        if (task.id === 0) return false;

        const isCreator = task.createdByUserId === userId;
        const isOwner = await this.taskRepo.isTeamOwnerOfTask(taskId, userId);
        if (!isCreator && !isOwner) return false;

        return this.taskRepo.update(taskId, dto);
    }

    async updateTaskStatus(
        taskId: number,
        dto: UpdateTaskStatusDto,
        userId: number,
    ): Promise<boolean>
    {
        const task = await this.taskRepo.findById(taskId);
        if (task.id === 0) return false;

        const isAssignee = await this.taskRepo.isAssignee(taskId, userId);
        const isOwner = await this.taskRepo.isTeamOwnerOfTask(taskId, userId);
        if (!isAssignee && !isOwner) return false;

        return this.taskRepo.updateStatus(taskId, dto);
    }

    async deleteTask(taskId: number, userId: number): Promise<boolean>
    {
        const task = await this.taskRepo.findById(taskId);
        if (task.id === 0) return false;

        const isCreator = task.createdByUserId === userId;
        const isOwner = await this.taskRepo.isTeamOwnerOfTask(taskId, userId);
        if (!isCreator && !isOwner) return false;

        return this.taskRepo.delete(taskId);
    }

    async addAssignee(
        taskId: number,
        dto: AddTaskAssigneeDto,
        callerId: number,
    ): Promise<boolean>
    {
        const task = await this.taskRepo.findById(taskId);
        if (task.id === 0) return false;

        const isTeamMember = await this.taskRepo.isUserInProjectTeam(task.projectId, dto.userId);
        if (!isTeamMember) return false;

        const alreadyAssigned = await this.taskRepo.isAssignee(taskId, dto.userId);
        if (alreadyAssigned) return false;

        return this.taskRepo.addAssignee(taskId, callerId, dto);
    }

    async removeAssignee(
        taskId: number,
        assigneeUserId: number,
        callerId: number,
    ): Promise<boolean>
    {
        return this.taskRepo.removeAssignee(taskId, assigneeUserId);
    }

    async addComment(
        taskId: number,
        dto: AddCommentDto,
        userId: number,
    ): Promise<CommentDto>
    {
        const task = await this.taskRepo.findById(taskId);
        if (task.id === 0) return new CommentDto();

        const isAssignee = await this.taskRepo.isAssignee(taskId, userId);
        const isOwner = await this.taskRepo.isTeamOwnerOfTask(taskId, userId);
        if (!isAssignee && !isOwner) return new CommentDto();

        const comment = await this.taskRepo.addComment(taskId, userId, dto);
        if (comment.id === 0) return new CommentDto();

        return this.toCommentDto(comment);
    }

    async deleteComment(commentId: number, userId: number): Promise<boolean>
    {
        const comment = await this.taskRepo.findCommentById(commentId);
        if (comment.id === 0) return false;

        if (comment.userId !== userId) return false;

        return this.taskRepo.deleteComment(commentId);
    }
}