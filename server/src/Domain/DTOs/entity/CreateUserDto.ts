// TODO: Replace with the fields needed to create your domain entity
export class CreateUserDto {
  constructor(
    public userId: number = 0,
    public username: string = "",
    public email: string = "",
    public password: string = "",
    public fullName: string = "",
    public avatar: string = "",
  ) {}
}
