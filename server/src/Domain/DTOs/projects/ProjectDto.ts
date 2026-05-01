import { ProjectStatus } from "../../enums/ProjectStatus";
import { Priority } from "../../enums/Priority";
import { TagDto } from "../tags/TagDto";

export class ProjectDto  {
    public constructor(
       public id: number = 0,
       public teamId: number = 0,
       public name: string = "",
       public description: string = "",
       public status: ProjectStatus = ProjectStatus.PLANNING,
       public priority: Priority = Priority.LOW,
       public deadline: Date | null = null, 
       public tags: TagDto[] = [],  // ovo je veza M:N - vise tagova moze postojati 
       public watcherCount: number = 0, // broj samo ne list-a
       public createdAt: Date | null = null,
       public updatedAt: Date | null = null,
    ) {}
}