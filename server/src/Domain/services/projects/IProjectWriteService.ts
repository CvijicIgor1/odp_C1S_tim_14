import { CreateProjectDto } from '../../DTOs/projects/CreateProjectDto';
import { ProjectDto } from '../../DTOs/projects/ProjectDto';
import { UpdateProjectDto } from '../../DTOs/projects/UpdateProjectDto';
import { CreateProjectResult } from '../../enums/CreateProjectResult';
import { UpdateProjectResult } from '../../enums/UpdateProjectResult';

export interface IProjectWriteService {
    createProject(teamId: number, dto: CreateProjectDto, userId: number, isAdmin?: boolean): Promise<{ result: CreateProjectResult; project?: ProjectDto }>;
    updateProject(id: number, dto: UpdateProjectDto, userId: number, isAdmin?: boolean): Promise<UpdateProjectResult>;
    deleteProject(id: number, userId: number, isAdmin?: boolean): Promise<boolean>;
}
