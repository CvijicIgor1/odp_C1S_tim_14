import type { ApiResponse } from "../team/ITeamAPIService";
import type {
  ProjectDto, TagDto, PaginatedList,
  ProjectStatus, Priority,
} from "../../models/project/ProjectTypes";

export type { ApiResponse };

export interface IProjectAPIService {
  getTeamProjects(
    teamId: number,
    page?: number,
    limit?: number,
    filters?: { status?: ProjectStatus; priority?: Priority; tagId?: number }
  ): Promise<ApiResponse<PaginatedList<ProjectDto>>>;

  getWatched(page?: number, limit?: number): Promise<ApiResponse<PaginatedList<ProjectDto>>>;

  getById(id: number): Promise<ApiResponse<ProjectDto>>;

  create(
    teamId: number,
    name: string,
    description: string,
    status: ProjectStatus,
    priority: Priority,
    deadline: string,
    tagIds?: number[]
  ): Promise<ApiResponse<ProjectDto>>;

  update(
    id: number,
    data: { name?: string; description?: string; status?: ProjectStatus; priority?: Priority; deadline?: string }
  ): Promise<ApiResponse<void>>;

  delete(id: number): Promise<ApiResponse<void>>;

  addTag(id: number, tagId: number): Promise<ApiResponse<void>>;
  removeTag(id: number, tagId: number): Promise<ApiResponse<void>>;
  watch(id: number): Promise<ApiResponse<void>>;
  unwatch(id: number): Promise<ApiResponse<void>>;
}
