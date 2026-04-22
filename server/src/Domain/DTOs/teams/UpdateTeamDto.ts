export class UpdateTeamDto {
  public constructor(
    public name: string = "",
    public description: string = "",
    public avatar: string = "",
  ) {}
}

//stvari koje nema smisla apdejtovati su uklonjene, a od ostalih NE MORAJU se sve menjati
//ali moram da ih ostavim ako neko ipak hoce sve 3 da menja