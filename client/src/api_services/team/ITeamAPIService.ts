import type { TeamDto, TeamMemberDto, PaginatedList } from "../../models/team/TeamTypes";

export type ApiResponse<T> = { success: boolean; message: string; data?: T };

export interface ITeamAPIService {
  getAll(page?: number, limit?: number): Promise<ApiResponse<PaginatedList<TeamDto>>>;
  getById(id: number): Promise<ApiResponse<TeamDto>>;
  create(name: string, description: string, avatar: string): Promise<ApiResponse<TeamDto>>;
  update(id: number, name?: string, description?: string, avatar?: string): Promise<ApiResponse<void>>;
  delete(id: number): Promise<ApiResponse<void>>;
  addMember(teamId: number, username: string, role?: "owner" | "member"): Promise<ApiResponse<void>>;
  updateMemberRole(teamId: number, userId: number, role: "owner" | "member"): Promise<ApiResponse<void>>;
  removeMember(teamId: number, userId: number): Promise<ApiResponse<void>>;
}
