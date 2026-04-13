import { UserRole } from "../../enums/UserRole";

export class UserDto {
  constructor(
      public id: number = 0,
      public username: string = "",
      public email: string = "",
      public role: UserRole = UserRole.USER,
      public fullName: string = "",
      public avatar: string = "",
      public isActive: boolean = true,
      public createdAt?: Date,
      public updatedAt?: Date,
  ) {}
}
