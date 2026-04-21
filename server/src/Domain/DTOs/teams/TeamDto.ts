export class TeamDto {
  public constructor(
    public id: number = 0,
    public userId: number | null=null,
    public username: string = "",
    public name: string = "",
    public description: string = "",
    public avatar: string = "",
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}
}