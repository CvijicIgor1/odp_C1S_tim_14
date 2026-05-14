import { Project } from "../../models/Project";

export interface IProjectCommandRepository {
    create(teamId: number, newProject: Project): Promise<Project>;
    update(id: number, inputProject: Project): Promise<boolean>;
    delete(id: number): Promise<boolean>;
}
