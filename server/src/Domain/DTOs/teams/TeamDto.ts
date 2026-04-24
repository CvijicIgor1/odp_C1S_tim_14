export class TeamDto {
  public constructor(
    public id: number = 0,
    public name: string = "",
    public description: string = "",
    public avatar: string = "",
    public updatedAt: Date | null= null,
    public createdAt: Date | null = null
  ) {}
}

//ovaj konkretan DTO korisim kad funkcije vracaju timove, da mogu da ih pretocim u DTO i metnem u paginatedList (u TeamService se desava)