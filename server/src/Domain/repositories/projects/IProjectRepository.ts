import { Project } from "../../models/Project";
import { Tag } from "../../models/Tag";
import { ProjectFilters } from '../../types/ProjectFilters';

export interface IProjectRepository {
    findAllByTeam(teamId:number, page: number, limit: number, filters?: ProjectFilters): Promise<{ projects: Project[]; totalNumber: number }>;
    findAllAsAdmin(page: number, limit: number): Promise<{ projects: Project[]; totalNumber: number }>;
    findById(id: number): Promise<Project | null>;
    create(teamId: number, newProject: Project): Promise<Project>;
    update(id: number, inputProject: Project): Promise<boolean>;
    delete(id: number): Promise<boolean>;
    addTag(projectId: number, tagId: number): Promise<boolean>;
    removeTag(projectId: number, tagId: number): Promise<boolean>;
    getTagsForProject(projectId: number): Promise<Tag[]>;
    getTagsForProjects(projectIds: number[]): Promise<Map<number, Tag[]>>;
    addWatcher(projectId: number, userId: number): Promise<boolean>;
    removeWatcher(projectId: number, userId: number): Promise<boolean>;
    findWatchedByUser(userId: number, page: number, limit: number): Promise<{ projects: Project[]; totalNumber: number }>;
    isTeamMember(projectId: number, userId: number): Promise<boolean>;
    isTeamOwner(projectId: number, userId: number): Promise<boolean>;
    isWatcher(projectId: number, userId: number): Promise<boolean>;
    getWatcherCount(projectId: number): Promise<number>;    
    getWatcherCounts(projectIds: number[]): Promise<Map<number, number>>;
}