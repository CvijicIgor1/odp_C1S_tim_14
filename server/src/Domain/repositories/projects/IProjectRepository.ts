import { Project } from "../../models/Project";
import { CreateProjectDto } from "../../DTOs/projects/CreateProjectDto";
import { UpdateProjectDto } from "../../DTOs/projects/UpdateProjectDto";
import { Tag } from "../../models/Tag";
import { ProjectFilters } from '../../types/ProjectFilters';

export interface IProjectRepository {
    findAllByTeam(teamId:number, page: number, limit: number, filters?: ProjectFilters): Promise<{ projects: Project[]; totalNumber: number }>;
    findById(id: number): Promise<Project | null>;
    create(teamId: number, dto: CreateProjectDto): Promise<Project>;
    update(id: number, dto: UpdateProjectDto): Promise<boolean>;
    delete(id: number): Promise<boolean>;
    addTag(projectId: number, tagId: number): Promise<boolean>;
    removeTag(projectId: number, tagId: number): Promise<boolean>;
    getTagsForProject(projectId: number): Promise<Tag[]>;
    addWatcher(projectId: number, userId: number): Promise<boolean>;
    removeWatcher(projectId: number, userId: number): Promise<boolean>;
    findWatchedByUser(userId: number, page: number, limit: number): Promise<{ projects: Project[]; totalNumber: number }>;
    isTeamMember(projectId: number, userId: number): Promise<boolean>;
    isTeamOwner(projectId: number, userId: number): Promise<boolean>;
    isWatcher(projectId: number, userId: number): Promise<boolean>;
    getWatcherCount(projectId: number): Promise<number>;    
}