import { IUserService } from "../../Domain/services/users/IUserService";
import { IUserRepository } from "../../Domain/repositories/users/IUserRepository";
import { UserDto } from "../../Domain/DTOs/users/UserDto";
import { UserRole } from "../../Domain/enums/UserRole";

export class UserService implements IUserService {
  public constructor(private readonly userRepo: IUserRepository) {}

  async getAll(): Promise<UserDto[]> {
    const users = await this.userRepo.findAll();
    return users.map((u) => new UserDto(u.id, u.username, u.email, u.role, u.fullName, u.avatar, Boolean(u.isActive), u.createdAt, u.updatedAt));
  }

  async getById(id: number): Promise<UserDto | null> {
    const u = await this.userRepo.findById(id);
    if (u.id === 0) return null;
    return new UserDto(u.id, u.username, u.email, u.role, u.fullName, u.avatar, Boolean(u.isActive), u.createdAt, u.updatedAt);
  }

  async updateRole(id: number, role: UserRole): Promise<boolean> {
    return this.userRepo.updateRole(id, role);
  }

  async updateStatus(id: number, isActive: boolean): Promise<boolean> {
    return this.userRepo.updateStatus(id, isActive);
  }

  async deactivate(id: number): Promise<boolean> {
    return this.userRepo.deactivate(id);
  }
}
