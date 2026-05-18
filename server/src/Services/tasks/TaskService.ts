import { ITaskReadService } from "../../Domain/services/tasks/ITaskReadService";
import { ITaskWriteService } from "../../Domain/services/tasks/ITaskWriteService";
import { ITaskCommentService } from "../../Domain/services/tasks/ITaskCommentService";
import { ITaskQueryRepository } from "../../Domain/repositories/tasks/ITaskQueryRepository";
import { ITaskCommandRepository } from "../../Domain/repositories/tasks/ITaskCommandRepository";
import { ITaskAssigneeRepository } from "../../Domain/repositories/tasks/ITaskAssigneeRepository";
import { ITaskCommentRepository } from "../../Domain/repositories/tasks/ITaskCommentRepository";
import { ITaskAccessRepository } from "../../Domain/repositories/tasks/ITaskAccessRepository";
import { TaskDto } from "../../Domain/DTOs/tasks/TaskDto";
import { TaskDetailDto } from "../../Domain/DTOs/tasks/TaskDetailDto";
import { CreateTaskDto } from "../../Domain/DTOs/tasks/CreateTaskDto";
import { UpdateTaskDto } from "../../Domain/DTOs/tasks/UpdateTaskDto";
import { UpdateTaskStatusDto } from "../../Domain/DTOs/tasks/UpdateTaskStatusDto";
import { AddTaskAssigneeDto } from "../../Domain/DTOs/tasks/AddTaskAssigneeDto";
import { AddCommentDto } from "../../Domain/DTOs/tasks/AddCommentDto";
import { CommentDto } from "../../Domain/DTOs/tasks/CommentDto";
import { TaskAssigneeDto } from "../../Domain/DTOs/tasks/TaskAssigneeDto";
import { GroupedTasksDto } from "../../Domain/DTOs/tasks/GroupedTasksDto";
import { Task } from "../../Domain/models/Task";
import { Comment } from "../../Domain/models/Comment";
import { TaskAssignee } from "../../Domain/models/TaskAssignee";
import { TaskOperationResult } from "../../Domain/enums/TaskOperationResult";
import { AddCommentResult } from "../../Domain/enums/AddCommentResult";

export class TaskService implements ITaskReadService, ITaskWriteService, ITaskCommentService {
    public constructor(
        private readonly taskQueryRepository: ITaskQueryRepository,
        private readonly taskCommandRepository: ITaskCommandRepository,
        private readonly taskAssigneeRepository: ITaskAssigneeRepository,
        private readonly taskCommentRepository: ITaskCommentRepository,
        private readonly taskAccessRepository: ITaskAccessRepository,
    ) { }


    private toDto(task: Task): TaskDto {
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
            task.updatedAt
        );
    }

    private toCommentDto(comment: Comment): CommentDto {
        return new CommentDto(
            comment.id,
            comment.taskId,
            comment.userId,
            comment.content,
            comment.createdAt
        );
    }

    private toAssigneeDto(assignee: TaskAssignee): TaskAssigneeDto {
        return new TaskAssigneeDto(
            assignee.taskId,
            assignee.userId,
            assignee.assignedBy,
            assignee.assignedAt
        );
    }


    async getByProjectId(
        projectId: number,
        userId: number,
        isAdmin: boolean
    ): Promise<GroupedTasksDto> {
        const empty = new GroupedTasksDto([], [], []);

        const isMember = await this.taskAccessRepository.isUserInProjectTeam(projectId, userId);
        if (!isAdmin && !isMember) return empty;

        const { todo, in_progress, done } = await this.taskQueryRepository.findByProjectId(projectId);

        return new GroupedTasksDto(
            todo.map((t) => this.toDto(t)),
            in_progress.map((t) => this.toDto(t)),
            done.map((t) => this.toDto(t))
        );
    }

    async getById(
        taskId: number,
        userId: number,
        isAdmin: boolean
    ): Promise<TaskDetailDto> {
        const empty = new TaskDetailDto();

        const task = await this.taskQueryRepository.findById(taskId);
        if (task.id === 0) return empty;

        const isMember = await this.taskAccessRepository.isUserInProjectTeam(task.projectId, userId);
        if (!isAdmin && !isMember) return empty;

        const comments = await this.taskCommentRepository.getComments(taskId);
        const assignees = await this.taskQueryRepository.getAssignees(taskId);

        return new TaskDetailDto(
            this.toDto(task),
            comments.map((c) => this.toCommentDto(c)),
            assignees.map((a) => this.toAssigneeDto(a))
        );
    }

    async getMyTasks(userId: number): Promise<TaskDto[]> {
        const tasks = await this.taskQueryRepository.findByAssignee(userId);
        return tasks.map((t) => this.toDto(t));
    }

    async createTask(dto: CreateTaskDto, userId: number): Promise<TaskDto> {
        const newTask = new Task(
            0,
            dto.projectId,
            userId,
            dto.title,
            dto.description,
            dto.status,
            dto.priority,
            dto.deadline,
            dto.estimatedHours,
        );
        const created = await this.taskCommandRepository.create(newTask);
        if (created.id === 0) return new TaskDto();
        return this.toDto(created);
    }

    async updateTask(
        taskId: number,
        dto: UpdateTaskDto,
        userId: number
    ): Promise<TaskOperationResult> {
        const task = await this.taskQueryRepository.findById(taskId);
        if (task.id === 0) return TaskOperationResult.NotFound;

        const canEdit = task.createdByUserId === userId
            || await this.taskAccessRepository.isTeamOwnerOfTask(taskId, userId);

        if (!canEdit) return TaskOperationResult.Forbidden;

        const updatedTask = new Task(
            0,
            0,
            0,
            dto.title,
            dto.description,
            undefined,
            dto.priority,
            dto.deadline,
            dto.estimatedHours,
        );
        const ok = await this.taskCommandRepository.update(taskId, updatedTask);
        if (!ok) return TaskOperationResult.NotFound;

        return TaskOperationResult.Success;
    }

    async updateTaskStatus(
        taskId: number,
        dto: UpdateTaskStatusDto,
        userId: number
    ): Promise<TaskOperationResult> {
        const task = await this.taskQueryRepository.findById(taskId);
        if (task.id === 0) return TaskOperationResult.NotFound;

        const canChange = await this.taskAssigneeRepository.isAssignee(taskId, userId)
            || await this.taskAccessRepository.isTeamOwnerOfTask(taskId, userId);

        if (!canChange) return TaskOperationResult.Forbidden;

        const ok = await this.taskCommandRepository.updateStatus(taskId, dto.status);
        if (!ok) return TaskOperationResult.NotFound;

        return TaskOperationResult.Success;
    }

    async deleteTask(
        taskId: number,
        userId: number
    ): Promise<boolean> {
        const task = await this.taskQueryRepository.findById(taskId);
        if (task.id === 0) return false;

        const canDelete = task.createdByUserId === userId
            || await this.taskAccessRepository.isTeamOwnerOfTask(taskId, userId);

        if (!canDelete) return false;

        return this.taskCommandRepository.delete(taskId);
    }

    async addAssignee(
        taskId: number,
        dto: AddTaskAssigneeDto,
        callerId: number
    ): Promise<boolean> {
        const task = await this.taskQueryRepository.findById(taskId);
        if (task.id === 0) return false;

        const isTeamMember = await this.taskAccessRepository.isUserInProjectTeam(task.projectId, dto.userId);
        if (!isTeamMember) return false;

        const alreadyAssigned = await this.taskAssigneeRepository.isAssignee(taskId, dto.userId);
        if (alreadyAssigned) return false;

        return this.taskAssigneeRepository.addAssignee(taskId, dto.userId, callerId);
    }

    async removeAssignee(
        taskId: number,
        assigneeUserId: number,
        callerId: number
    ): Promise<boolean> {
        return this.taskAssigneeRepository.removeAssignee(taskId, assigneeUserId);
    }

    async addComment(
        taskId: number,
        dto: AddCommentDto,
        userId: number
    ): Promise<{ result: AddCommentResult; comment?: CommentDto }> {
        const task = await this.taskQueryRepository.findById(taskId);
        if (task.id === 0) return { result: AddCommentResult.NotFound };

        const canComment = await this.taskAssigneeRepository.isAssignee(taskId, userId)
            || await this.taskAccessRepository.isTeamOwnerOfTask(taskId, userId);

        if (!canComment) return { result: AddCommentResult.Forbidden };

        const comment = await this.taskCommentRepository.addComment(taskId, userId, dto.content);
        if (comment.id === 0) return { result: AddCommentResult.NotFound };

        return { result: AddCommentResult.Success, comment: this.toCommentDto(comment) };
    }

    async deleteComment(
        commentId: number,
        userId: number
    ): Promise<boolean> {
        const comment = await this.taskCommentRepository.findCommentById(commentId);
        if (comment.id === 0) return false;

        if (comment.userId !== userId) return false;

        return this.taskCommentRepository.deleteComment(commentId);
    }
}
