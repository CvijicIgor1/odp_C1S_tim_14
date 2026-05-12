import { AuthUserDto } from "../../DTOs/auth/AuthUserDto";

export interface IAuthService {
  login(username: string, password: string): Promise<AuthUserDto>;
  register(username: string, email: string, password: string, full_name?: string, avatar?: string): Promise<AuthUserDto>;
}
