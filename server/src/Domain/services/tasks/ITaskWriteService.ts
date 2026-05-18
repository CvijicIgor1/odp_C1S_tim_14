import { TaskDto } from "../../DTOs/tasks/TaskDto";
import { CreateTaskDto } from "../../DTOs/tasks/CreateTaskDto";
import { UpdateTaskDto } from "../../DTOs/tasks/UpdateTaskDto";
import { UpdateTaskStatusDto } from "../../DTOs/tasks/UpdateTaskStatusDto";
import { AddTaskAssigneeDto } from "../../DTOs/tasks/AddTaskAssigneeDto";
import { TaskOperationResult } from "../../enums/TaskOperationResult";

export interface ITaskWriteService
{
    createTask(dto: CreateTaskDto, userId: number): Promise<{ result: TaskOperationResult; task?: TaskDto }>;

    updateTask(taskId: number, dto: UpdateTaskDto, userId: number): Promise<TaskOperationResult>;

    updateTaskStatus(taskId: number, dto: UpdateTaskStatusDto, userId: number): Promise<TaskOperationResult>;

    deleteTask(taskId: number, userId: number): Promise<boolean>;

    addAssignee(taskId: number, dto: AddTaskAssigneeDto, callerId: number): Promise<TaskOperationResult>;

    removeAssignee(taskId: number, assigneeUserId: number, callerId: number): Promise<boolean>;
}
