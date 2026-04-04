import { ProjectStatus } from "../enums/ProjectStatus";
import { Priority } from "../enums/Priority";


export class Project {
  public constructor(
    public id: number = 0,
    public teamId: number = 0,
    public name: string = "",
    public description: string = "",
    public status: ProjectStatus = ProjectStatus.PLANNING,
    public priority: Priority = Priority.MEDIUM,
    public deadline: Date = new Date(),
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
  ) {}
}