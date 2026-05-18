import { PaginatedListDto } from '../../DTOs/paginatedList/PaginatedListDto';
import { ProjectDto } from '../../DTOs/projects/ProjectDto';
import { ProjectFilters } from '../../types/ProjectFilters';

export interface IProjectReadService {
    getTeamProjects(teamId: number, userId: number, page: number, limit: number, filters?: ProjectFilters): Promise<PaginatedListDto<ProjectDto>>;
    getAllProjectsAsAdmin(page: number, limit: number): Promise<PaginatedListDto<ProjectDto>>;
    getProjectById(id: number, userId: number, isAdmin?: boolean): Promise<ProjectDto>;
    getWatchedProjects(userId: number, page: number, limit: number): Promise<PaginatedListDto<ProjectDto>>;
}
