import { UserRole } from "../enums/UserRole";

export class User {
  public constructor(
    public id: number = 0,
    public username: string = "",
    public email: string = "",
    public passwordHash: string = "",
    public fullName: string = "",
    public avatar: string = "",
    public role: UserRole = UserRole.USER,
    public isActive: number = 1,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}
}