import { Project } from "../../models/Project";
import { ProjectFilters } from '../../types/ProjectFilters';

export interface IProjectQueryRepository {
    findAllByTeam(teamId: number, page: number, limit: number, filters?: ProjectFilters): Promise<{ projects: Project[]; totalNumber: number }>;
    findAllAsAdmin(page: number, limit: number): Promise<{ projects: Project[]; totalNumber: number }>;
    findById(id: number): Promise<Project | null>;
    findWatchedByUser(userId: number, page: number, limit: number): Promise<{ projects: Project[]; totalNumber: number }>;
}
