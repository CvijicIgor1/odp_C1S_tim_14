import { ProjectStatus } from "../../enums/ProjectStatus";
import { Priority } from "../../enums/Priority";

export class UpdateProjectDto {
    public constructor(
         public name?: string,
         public description?: string,
         public status?: ProjectStatus,
         public priority?: Priority,
         public deadline?: string,
    ) {}

}