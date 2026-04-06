import { UserRole } from "../enums/UserRole";

export class User {
  constructor(
    public id: number           = 0,
    public username: string     = "",
    public email: string        = "",
    public role: UserRole       = UserRole.USER,
    public password_hash: string = "",
    public full_name: string    = "",
    public is_active: number    = 1,
  ) {}
}
