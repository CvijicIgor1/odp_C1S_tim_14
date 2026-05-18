import { GroupedTasksDto } from "../../DTOs/tasks/GroupedTasksDto";
import { TaskDetailDto } from "../../DTOs/tasks/TaskDetailDto";
import { TaskDto } from "../../DTOs/tasks/TaskDto";

export interface ITaskReadService
{
    getByProjectId(projectId: number, userId: number, isAdmin: boolean): Promise<GroupedTasksDto>;
    getById(taskId: number, userId: number, isAdmin: boolean): Promise<TaskDetailDto>;
    getMyTasks(userId: number): Promise<TaskDto[]>;
}
