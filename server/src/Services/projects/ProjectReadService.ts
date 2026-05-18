import { IProjectReadService } from "../../Domain/services/projects/IProjectReadService";
import { IProjectQueryRepository } from "../../Domain/repositories/projects/IProjectQueryRepository";
import { IProjectTagRepository } from "../../Domain/repositories/projects/IProjectTagRepository";
import { IProjectWatcherRepository } from "../../Domain/repositories/projects/IProjectWatcherRepository";
import { IProjectAccessRepository } from "../../Domain/repositories/projects/IProjectAccessRepository";
import { ITeamQueryRepository } from "../../Domain/repositories/teams/ITeamQueryRepository";
import { ProjectDto } from "../../Domain/DTOs/projects/ProjectDto";
import { PaginatedListDto } from "../../Domain/DTOs/paginatedList/PaginatedListDto";
import { ProjectFilters } from "../../Domain/types/ProjectFilters";
import { Project } from "../../Domain/models/Project";
import { Tag } from "../../Domain/models/Tag";
import { TagDto } from "../../Domain/DTOs/tags/TagDto";

export class ProjectReadService implements IProjectReadService {
    public constructor(
        private readonly projectQueryRepository: IProjectQueryRepository,
        private readonly projectTagRepository: IProjectTagRepository,
        private readonly projectWatcherRepository: IProjectWatcherRepository,
        private readonly projectAccessRepository: IProjectAccessRepository,
        private readonly teamQueryRepository: ITeamQueryRepository,
    ) {}

    private toDto(project: Project, tags: Tag[], watcherCount: number): ProjectDto {
        return new ProjectDto(
            project.id,
            project.teamId,
            project.name,
            project.description,
            project.status,
            project.priority,
            project.deadline,
            tags.map((t) => new TagDto(t.id, t.name)),
            watcherCount,
            project.createdAt,
            project.updatedAt,
        );
    }

    private async isTeamMember(teamId: number, userId: number): Promise<boolean> {
        const { members } = await this.teamQueryRepository.getMembers(teamId);
        return members.some((member) => member.userId === userId);
    }

    async getTeamProjects(teamId: number, userId: number, page: number, limit: number, filters?: ProjectFilters, isAdmin: boolean = false): Promise<PaginatedListDto<ProjectDto>> {
        const isMember = isAdmin || await this.isTeamMember(teamId, userId);
        if (!isMember) return new PaginatedListDto<ProjectDto>([], 0, page, limit);

        const { projects: paged, totalNumber } = await this.projectQueryRepository.findAllByTeam(teamId, page, limit, filters);

        const ids = paged.map((p) => p.id);
        const [tagsMap, countsMap] = await Promise.all([
            this.projectTagRepository.getTagsForProjects(ids),
            this.projectWatcherRepository.getWatcherCounts(ids),
        ]);

        const dtos = paged.map((project) =>
            this.toDto(project, tagsMap.get(project.id) ?? [], countsMap.get(project.id) ?? 0)
        );

        return new PaginatedListDto<ProjectDto>(dtos, totalNumber, page, limit);
    }

    async getAllProjectsAsAdmin(page: number, limit: number): Promise<PaginatedListDto<ProjectDto>> {
        const { projects, totalNumber } = await this.projectQueryRepository.findAllAsAdmin(page, limit);

        const ids = projects.map((p) => p.id);
        const [tagsMap, countsMap] = await Promise.all([
            this.projectTagRepository.getTagsForProjects(ids),
            this.projectWatcherRepository.getWatcherCounts(ids),
        ]);

        const dtos = projects.map((project) =>
            this.toDto(project, tagsMap.get(project.id) ?? [], countsMap.get(project.id) ?? 0)
        );

        return new PaginatedListDto<ProjectDto>(dtos, totalNumber, page, limit);
    }

    async getProjectById(id: number, userId: number, isAdmin: boolean = false): Promise<ProjectDto> {
        const project = await this.projectQueryRepository.findById(id);
        if (!project || project.id === 0) return new ProjectDto();

        if (!isAdmin) {
            const isMember = await this.projectAccessRepository.isTeamMember(id, userId);
            if (!isMember) return new ProjectDto();
        }

        const tags = await this.projectTagRepository.getTagsForProject(id);
        const watcherCount = await this.projectWatcherRepository.getWatcherCount(id);
        return this.toDto(project, tags, watcherCount);
    }

    async getWatchedProjects(userId: number, page: number, limit: number): Promise<PaginatedListDto<ProjectDto>> {
        const { projects: paged, totalNumber } = await this.projectQueryRepository.findWatchedByUser(userId, page, limit);

        const ids = paged.map((p) => p.id);
        const [tagsMap, countsMap] = await Promise.all([
            this.projectTagRepository.getTagsForProjects(ids),
            this.projectWatcherRepository.getWatcherCounts(ids),
        ]);

        const dtos = paged.map((p) =>
            this.toDto(p, tagsMap.get(p.id) ?? [], countsMap.get(p.id) ?? 0)
        );

        return new PaginatedListDto(dtos, totalNumber, page, limit);
    }
}
