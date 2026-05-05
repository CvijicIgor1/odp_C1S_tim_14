import { User } from "../../models/User";
import { UserRole } from "../../enums/UserRole";

export interface IUserRepository {
  findById(id: number): Promise<User>;
  findByUsername(username: string): Promise<User>;
  findByEmail(email: string): Promise<User>;
  findAll(): Promise<User[]>;
  create(user: User): Promise<User>;
  update(user: User): Promise<boolean>;
  updateRole(id: number, role: UserRole): Promise<boolean>;
  updateStatus(id: number, isActive: boolean): Promise<boolean>;
  deactivate(id: number): Promise<boolean>;
}
