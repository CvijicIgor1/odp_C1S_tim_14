import type { ApiResponse } from "../team/ITeamAPIService";
import type { TaskDetailDto, GroupedTasksDto, CommentDto, TaskStatus, Priority } from "../../models/project/ProjectTypes";

export interface ITaskAPIService {
  getByProject(projectId: number): Promise<ApiResponse<GroupedTasksDto>>;

  getById(id: number): Promise<ApiResponse<TaskDetailDto>>;

  create(
    projectId: number,
    title: string,
    description: string,
    status: TaskStatus,
    priority: Priority,
    deadline: string,
    estimatedHours?: number
  ): Promise<ApiResponse<import("../../models/project/ProjectTypes").TaskDto>>;

  update(
    id: number,
    data: { title?: string; description?: string; priority?: Priority; deadline?: string; estimatedHours?: number }
  ): Promise<ApiResponse<void>>;

  updateStatus(id: number, status: TaskStatus): Promise<ApiResponse<void>>;

  delete(id: number): Promise<ApiResponse<void>>;

  addAssignee(taskId: number, userId: number): Promise<ApiResponse<void>>;
  removeAssignee(taskId: number, userId: number): Promise<ApiResponse<void>>;

  addComment(taskId: number, content: string): Promise<ApiResponse<CommentDto>>;
  deleteComment(taskId: number, commentId: number): Promise<ApiResponse<void>>;
}
