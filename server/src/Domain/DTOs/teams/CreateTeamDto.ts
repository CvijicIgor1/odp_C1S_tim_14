export class CreateTeamDto {
  public constructor(
    public name: string = "",
    public description: string = "",
    public avatar: string = "",
  ) {}
}

//podaci o korisniku se nalaze u tokenu, a datumi i id se pri insertu dodaju,
//bar je tako meni logicno