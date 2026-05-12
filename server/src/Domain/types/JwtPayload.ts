import { UserRole } from "../enums/UserRole";
export type JwtPayload = {
  user_id: number;
  username: string;
  role: UserRole;
};
