import { ProjectStatus } from "../../enums/ProjectStatus";
import { Priority } from "../../enums/Priority";

export class CreateProjectDto  {
    public constructor(
         public name: string="",
         public description: string="",
         public status: ProjectStatus = ProjectStatus.PLANNING,
         public priority: Priority = Priority.LOW,
         public deadline: string | null = null, // string iz req se dobija !? HTTP salje kao string , ne treba Date
         public tagIds: number[] = [],  // ID-jevi postojećih tagova koji se dodaju odmah
    ) {}

}