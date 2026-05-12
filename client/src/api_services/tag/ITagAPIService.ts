import type { ApiResponse } from "../team/ITeamAPIService";
import type { TagDto, PaginatedList } from "../../models/project/ProjectTypes";

export interface ITagAPIService {
  getAll(page?: number, limit?: number): Promise<ApiResponse<PaginatedList<TagDto>>>;
  create(name: string): Promise<ApiResponse<TagDto>>;
  delete(id: number): Promise<ApiResponse<void>>;
}
