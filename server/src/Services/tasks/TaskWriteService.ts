import { ITaskWriteService } from "../../Domain/services/tasks/ITaskWriteService";
import { ITaskQueryRepository } from "../../Domain/repositories/tasks/ITaskQueryRepository";
import { ITaskCommandRepository } from "../../Domain/repositories/tasks/ITaskCommandRepository";
import { ITaskAssigneeRepository } from "../../Domain/repositories/tasks/ITaskAssigneeRepository";
import { ITaskAccessRepository } from "../../Domain/repositories/tasks/ITaskAccessRepository";
import { TaskDto } from "../../Domain/DTOs/tasks/TaskDto";
import { CreateTaskDto } from "../../Domain/DTOs/tasks/CreateTaskDto";
import { UpdateTaskDto } from "../../Domain/DTOs/tasks/UpdateTaskDto";
import { UpdateTaskStatusDto } from "../../Domain/DTOs/tasks/UpdateTaskStatusDto";
import { AddTaskAssigneeDto } from "../../Domain/DTOs/tasks/AddTaskAssigneeDto";
import { Task } from "../../Domain/models/Task";
import { TaskOperationResult } from "../../Domain/enums/TaskOperationResult";

export class TaskWriteService implements ITaskWriteService {
    public constructor(
        private readonly taskQueryRepository: ITaskQueryRepository,
        private readonly taskCommandRepository: ITaskCommandRepository,
        private readonly taskAssigneeRepository: ITaskAssigneeRepository,
        private readonly taskAccessRepository: ITaskAccessRepository,
    ) {}

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

    async createTask(dto: CreateTaskDto, userId: number): Promise<{ result: TaskOperationResult; task?: TaskDto }> {
        const isMember = await this.taskAccessRepository.isUserInProjectTeam(dto.projectId, userId);
        if (!isMember) return { result: TaskOperationResult.Forbidden };

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
        if (created.id === 0) return { result: TaskOperationResult.Unavailable };
        return { result: TaskOperationResult.Success, task: this.toDto(created) };
    }

    async updateTask(taskId: number, dto: UpdateTaskDto, userId: number): Promise<TaskOperationResult> {
        const task = await this.taskQueryRepository.findById(taskId);
        if (task.id === 0) return TaskOperationResult.NotFound;

        const canEdit = task.createdByUserId === userId
            || await this.taskAccessRepository.isTeamOwnerOfTask(taskId, userId);

        if (!canEdit) return TaskOperationResult.Forbidden;

        const updatedTask = new Task(0, 0, 0, dto.title, dto.description, task.status, dto.priority, dto.deadline, dto.estimatedHours);
        const ok = await this.taskCommandRepository.update(taskId, updatedTask);
        if (!ok) return TaskOperationResult.NotFound;

        return TaskOperationResult.Success;
    }

    async updateTaskStatus(taskId: number, dto: UpdateTaskStatusDto, userId: number): Promise<TaskOperationResult> {
        const task = await this.taskQueryRepository.findById(taskId);
        if (task.id === 0) return TaskOperationResult.NotFound;

        const canChange = await this.taskAssigneeRepository.isAssignee(taskId, userId)
            || await this.taskAccessRepository.isTeamOwnerOfTask(taskId, userId);

        if (!canChange) return TaskOperationResult.Forbidden;

        const ok = await this.taskCommandRepository.updateStatus(taskId, dto.status);
        if (!ok) return TaskOperationResult.NotFound;

        return TaskOperationResult.Success;
    }

    async deleteTask(taskId: number, userId: number): Promise<boolean> {
        const task = await this.taskQueryRepository.findById(taskId);
        if (task.id === 0) return false;

        const canDelete = task.createdByUserId === userId
            || await this.taskAccessRepository.isTeamOwnerOfTask(taskId, userId);

        if (!canDelete) return false;

        return this.taskCommandRepository.delete(taskId);
    }

    async addAssignee(taskId: number, dto: AddTaskAssigneeDto, callerId: number): Promise<TaskOperationResult> {
        const task = await this.taskQueryRepository.findById(taskId);
        if (task.id === 0) return TaskOperationResult.NotFound;

        const canAssign = task.createdByUserId === callerId
            || await this.taskAccessRepository.isTeamOwnerOfTask(taskId, callerId);
        if (!canAssign) return TaskOperationResult.Forbidden;

        const isTeamMember = await this.taskAccessRepository.isUserInProjectTeam(task.projectId, dto.userId);
        if (!isTeamMember) return TaskOperationResult.InvalidInput;

        const alreadyAssigned = await this.taskAssigneeRepository.isAssignee(taskId, dto.userId);
        if (alreadyAssigned) return TaskOperationResult.InvalidInput;

        const added = await this.taskAssigneeRepository.addAssignee(taskId, dto.userId, callerId);
        return added ? TaskOperationResult.Success : TaskOperationResult.Unavailable;
    }

    async removeAssignee(taskId: number, assigneeUserId: number, callerId: number): Promise<boolean> {
        const task = await this.taskQueryRepository.findById(taskId);
        if (task.id === 0) return false;

        const canRemove = task.createdByUserId === callerId
            || await this.taskAccessRepository.isTeamOwnerOfTask(taskId, callerId);

        if (!canRemove) return false;

        return this.taskAssigneeRepository.removeAssignee(taskId, assigneeUserId);
    }
}
