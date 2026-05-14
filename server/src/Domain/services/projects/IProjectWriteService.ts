import { CreateProjectDto } from '../../DTOs/projects/CreateProjectDto';
import { ProjectDto } from '../../DTOs/projects/ProjectDto';
import { UpdateProjectDto } from '../../DTOs/projects/UpdateProjectDto';

export interface IProjectWriteService {
    createProject(teamId: number, dto: CreateProjectDto, userId: number): Promise<ProjectDto>;
    updateProject(id: number, dto: UpdateProjectDto, userId: number, isAdmin?: boolean): Promise<boolean>;
    deleteProject(id: number, userId: number, isAdmin?: boolean): Promise<boolean>;
}
