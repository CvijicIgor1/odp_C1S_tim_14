import { UserDto } from "../../DTOs/users/UserDto";
import { UserRole } from "../../enums/UserRole";

export interface IUserService {
  getAll(): Promise<UserDto[]>;
  getById(id: number): Promise<UserDto | null>;
  updateRole(id: number, role: UserRole): Promise<boolean>;
  updateStatus(id: number, isActive: boolean): Promise<boolean>;
  deactivate(id: number): Promise<boolean>;
}
