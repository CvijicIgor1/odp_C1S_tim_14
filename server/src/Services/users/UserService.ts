import bcrypt from "bcryptjs";
import { IUserService } from "../../Domain/services/users/IUserService";
import { IUserQueryRepository } from "../../Domain/repositories/users/IUserQueryRepository";
import { IUserCommandRepository } from "../../Domain/repositories/users/IUserCommandRepository";
import { IUserAdminRepository } from "../../Domain/repositories/users/IUserAdminRepository";
import { UserDto } from "../../Domain/DTOs/users/UserDto";
import { UserRole } from "../../Domain/enums/UserRole";

export class UserService implements IUserService {
  public constructor(
    private readonly userQueryRepository: IUserQueryRepository,
    private readonly userCommandRepository: IUserCommandRepository,
    private readonly userAdminRepository: IUserAdminRepository,
  ) {}

  async getAll(): Promise<UserDto[]> {
    const users = await this.userQueryRepository.findAll();
    return users.map((u) => new UserDto(u.id, u.username, u.email, u.role, u.fullName, u.avatar, Boolean(u.isActive), u.createdAt, u.updatedAt));
  }

  async getById(id: number): Promise<UserDto | null> {
    const u = await this.userQueryRepository.findById(id);
    if (u.id === 0) return null;
    return new UserDto(u.id, u.username, u.email, u.role, u.fullName, u.avatar, Boolean(u.isActive), u.createdAt, u.updatedAt);
  }

  async updateRole(id: number, role: UserRole): Promise<boolean> {
    return this.userAdminRepository.updateRole(id, role);
  }

  async updateStatus(id: number, isActive: boolean): Promise<boolean> {
    return this.userAdminRepository.updateStatus(id, isActive);
  }

  async deactivate(id: number): Promise<boolean> {
    return this.userAdminRepository.deactivate(id);
  }

  async updateProfile(id: number, username: string, email: string, avatar: string, newPassword?: string): Promise<boolean> {
    let passwordHash: string | undefined;
    if (newPassword) {
      const saltRounds = parseInt(process.env.SALT_ROUNDS ?? "10", 10);
      passwordHash = await bcrypt.hash(newPassword, saltRounds).catch(() => undefined);
      if (!passwordHash) return false;
    }
    return this.userCommandRepository.updateProfile(id, username, email, avatar, passwordHash);
  }
}