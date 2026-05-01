import { PaginatedListDto } from '../../DTOs/entity/PaginatedListDto';
import { CreateProjectDto } from '../../DTOs/projects/CreateProjectDto';
import { ProjectDto } from '../../DTOs/projects/ProjectDto';
import { UpdateProjectDto } from '../../DTOs/projects/UpdateProjectDto';
import { ProjectFilters } from '../../types/ProjectFilters';
 
export interface IProjectService {
  getTeamProjects(
    teamId: number,
    userId: number,
    page: number,
    limit: number,
    filters?: ProjectFilters
  ): Promise<PaginatedListDto<ProjectDto>>;

  getProjectById(id: number, userId: number): Promise<ProjectDto>;
  createProject(teamId: number,dto: CreateProjectDto,userId: number): Promise<ProjectDto>;
  updateProject(id: number, dto: UpdateProjectDto, userId: number, isAdmin?: boolean): Promise<boolean>;
  deleteProject(id: number, userId: number, isAdmin?: boolean): Promise<boolean>;
  addTag(projectId: number, tagId: number, userId: number, isAdmin?: boolean): Promise<boolean>;
  removeTag(projectId: number, tagId: number, userId: number, isAdmin?: boolean): Promise<boolean>;
  getWatchedProjects(userId: number, page: number, limit: number): Promise<PaginatedListDto<ProjectDto>>;
  watchProject(projectId: number, userId: number): Promise<boolean>;
  unwatchProject(projectId: number, userId: number): Promise<boolean>;
  checkOwnerOrAdmin(projectId: number, userId: number, isAdmin: boolean): Promise<boolean>;
}