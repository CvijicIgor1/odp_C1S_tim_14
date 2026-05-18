import { GroupedTasksDto } from "../../DTOs/tasks/GroupedTasksDto";
import { TaskDetailDto } from "../../DTOs/tasks/TaskDetailDto";
import { TaskDto } from "../../DTOs/tasks/TaskDto";
import { CommentDto } from "../../DTOs/tasks/CommentDto";
import { CreateTaskDto } from "../../DTOs/tasks/CreateTaskDto";
import { UpdateTaskDto } from "../../DTOs/tasks/UpdateTaskDto";
import { UpdateTaskStatusDto } from "../../DTOs/tasks/UpdateTaskStatusDto";
import { AddTaskAssigneeDto } from "../../DTOs/tasks/AddTaskAssigneeDto";
import { AddCommentDto } from "../../DTOs/tasks/AddCommentDto";
import { TaskOperationResult } from "../../enums/TaskOperationResult";
import { AddCommentResult } from "../../enums/AddCommentResult";

export interface ITaskService
{
    getByProjectId(projectId: number, userId: number, isAdmin: boolean): Promise<GroupedTasksDto>;

    getById(taskId: number, userId: number, isAdmin: boolean): Promise<TaskDetailDto>;

    getMyTasks(userId: number): Promise<TaskDto[]>;

    createTask(dto: CreateTaskDto, userId: number): Promise<TaskDto>;

    updateTask(taskId: number, dto: UpdateTaskDto, userId: number): Promise<TaskOperationResult>;

    updateTaskStatus(taskId: number, dto: UpdateTaskStatusDto, userId: number): Promise<TaskOperationResult>;

    deleteTask(taskId: number, userId: number): Promise<boolean>;

    addAssignee(taskId: number, dto: AddTaskAssigneeDto, callerId: number): Promise<boolean>;

    removeAssignee(taskId: number, assigneeUserId: number, callerId: number): Promise<boolean>;

    addComment(taskId: number, dto: AddCommentDto, userId: number): Promise<{ result: AddCommentResult; comment?: CommentDto }>;

    deleteComment(commentId: number, userId: number): Promise<boolean>;
}