import jwt from "jsonwebtoken";
import { ITokenService } from "../../Domain/services/auth/ITokenService";
import { AuthUserDto } from "../../Domain/DTOs/auth/AuthUserDto";

const TOKEN_EXPIRY = "24h";

export class TokenService implements ITokenService {
  private readonly secret: string;

  public constructor() {
    this.secret = process.env.JWT_SECRET ?? "";
  }

  sign(user: AuthUserDto): string {
    return jwt.sign(
      { user_id: user.id, username: user.username, role: user.role },
      this.secret,
      { expiresIn: TOKEN_EXPIRY }
    );
  }
}
