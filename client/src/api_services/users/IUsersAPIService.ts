import type { UserDto } from "../../models/user/UserTypes";

export type ApiResponse<T> = { success: boolean; message: string; data?: T };

export interface IUsersAPIService {
  updateProfile(id: number, username: string, email: string, avatar: string, newPassword?: string): Promise<ApiResponse<void>>;
  updateRole(id: number, role: string): Promise<ApiResponse<void>>;
  updateStatus(id: number, isActive: boolean): Promise<ApiResponse<void>>;
  getAll(): Promise<ApiResponse<UserDto[]>>;
  getById(id: number): Promise<ApiResponse<UserDto>>;
  deactivate(id: number): Promise<ApiResponse<void>>;
}
