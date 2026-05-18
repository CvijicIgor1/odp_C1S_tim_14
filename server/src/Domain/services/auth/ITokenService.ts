import { AuthUserDto } from "../../DTOs/auth/AuthUserDto";

export interface ITokenService {
  sign(user: AuthUserDto): string;
}
