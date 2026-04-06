
export class Team {
  public constructor(
    public id: number = 0,
    public name: string = "",
    public description: string = "",
    public avatar: string = "",
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}
}