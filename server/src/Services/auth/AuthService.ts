import bcrypt from "bcryptjs";
import { IAuthService } from "../../Domain/services/auth/IAuthService";
import { IUserQueryRepository } from "../../Domain/repositories/users/IUserQueryRepository";
import { IUserCommandRepository } from "../../Domain/repositories/users/IUserCommandRepository";
import { AuthUserDto } from "../../Domain/DTOs/auth/AuthUserDto";
import { UserRole } from "../../Domain/enums/UserRole";
import { User } from "../../Domain/models/User";
import { SALT_ROUNDS } from "../../Domain/constants/Constants";

export class AuthService implements IAuthService {
  public constructor(
    private readonly userQueryRepository: IUserQueryRepository,
    private readonly userCommandRepository: IUserCommandRepository,
  ) {}

  async login(username: string, password: string): Promise<AuthUserDto> {
    const user = await this.userQueryRepository.findByUsername(username);
    if (user.id === 0 || user.isActive === 0) return new AuthUserDto();
    const match = await bcrypt.compare(password, user.passwordHash).catch(() => false);
    if (!match) return new AuthUserDto();
    return new AuthUserDto(user.id, user.username, user.role , user.avatar);
  }

  async register(username: string, email: string, password: string, full_name: string = "", avatar: string = ""): Promise<AuthUserDto> {
    const byName = await this.userQueryRepository.findByUsername(username);
    if (byName.id !== 0) return new AuthUserDto();
    const byEmail = await this.userQueryRepository.findByEmail(email);
    if (byEmail.id !== 0) return new AuthUserDto();
    const hash = await bcrypt.hash(password, SALT_ROUNDS).catch(() => "");
    if (!hash) return new AuthUserDto();
    const created = await this.userCommandRepository.create(new User(0, username, email, UserRole.USER, hash, full_name, avatar));
    if (created === "duplicate" || created.id === 0) return new AuthUserDto();
    return new AuthUserDto(created.id, created.username, created.role, created.avatar);
  }
}
