import { IProjectWriteService } from "../../Domain/services/projects/IProjectWriteService";
import { IProjectQueryRepository } from "../../Domain/repositories/projects/IProjectQueryRepository";
import { IProjectCommandRepository } from "../../Domain/repositories/projects/IProjectCommandRepository";
import { IProjectTagRepository } from "../../Domain/repositories/projects/IProjectTagRepository";
import { IProjectWatcherRepository } from "../../Domain/repositories/projects/IProjectWatcherRepository";
import { IProjectAccessRepository } from "../../Domain/repositories/projects/IProjectAccessRepository";
import { ITeamQueryRepository } from "../../Domain/repositories/teams/ITeamQueryRepository";
import { CreateProjectDto } from "../../Domain/DTOs/projects/CreateProjectDto";
import { UpdateProjectDto } from "../../Domain/DTOs/projects/UpdateProjectDto";
import { ProjectDto } from "../../Domain/DTOs/projects/ProjectDto";
import { Project } from "../../Domain/models/Project";
import { Tag } from "../../Domain/models/Tag";
import { TagDto } from "../../Domain/DTOs/tags/TagDto";
import { CreateProjectResult } from "../../Domain/enums/CreateProjectResult";
import { UpdateProjectResult } from "../../Domain/enums/UpdateProjectResult";

export class ProjectWriteService implements IProjectWriteService {
    public constructor(
        private readonly projectQueryRepository: IProjectQueryRepository,
        private readonly projectCommandRepository: IProjectCommandRepository,
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

    private async checkOwnerOrAdmin(projectId: number, userId: number, isAdmin: boolean): Promise<boolean> {
        if (isAdmin) return true;
        return this.projectAccessRepository.isTeamOwner(projectId, userId);
    }

    private async isTeamMember(teamId: number, userId: number): Promise<boolean> {
        const { members } = await this.teamQueryRepository.getMembers(teamId);
        return members.some((member) => member.userId === userId);
    }

    async createProject(teamId: number, dto: CreateProjectDto, userId: number, isAdmin: boolean = false): Promise<{ result: CreateProjectResult; project?: ProjectDto }> {
        if (!dto.deadline) return { result: CreateProjectResult.Unavailable };
        const isMember = isAdmin || await this.isTeamMember(teamId, userId);
        if (!isMember) return { result: CreateProjectResult.Forbidden };

        const newProject = new Project(0, 0, dto.name, dto.description, dto.status, dto.priority, new Date(dto.deadline), new Date(), new Date());
        const created = await this.projectCommandRepository.create(teamId, newProject);
        if (created.id === 0) return { result: CreateProjectResult.Unavailable };

        if (dto.tagIds && dto.tagIds.length > 0) {
            await Promise.all(
                dto.tagIds.map((tagId) => this.projectTagRepository.addTag(created.id, tagId))
            );
        }

        const tags = await this.projectTagRepository.getTagsForProject(created.id);
        return { result: CreateProjectResult.Success, project: this.toDto(created, tags, 0) };
    }

    async updateProject(id: number, dto: UpdateProjectDto, userId: number, isAdmin: boolean = false): Promise<UpdateProjectResult> {
        const canEdit = await this.checkOwnerOrAdmin(id, userId, isAdmin);
        if (!canEdit) return UpdateProjectResult.Forbidden;
        const deadline = dto.deadline ? new Date(dto.deadline) : undefined;
        const inputProject = new Project(0, 0, dto.name, dto.description, dto.status, dto.priority, deadline, new Date(), new Date());
        const updated = await this.projectCommandRepository.update(id, inputProject);
        if (!updated) return UpdateProjectResult.NotFound;

        return UpdateProjectResult.Success;
    }

    async deleteProject(id: number, userId: number, isAdmin: boolean = false): Promise<boolean> {
        const canEdit = await this.checkOwnerOrAdmin(id, userId, isAdmin);
        if (!canEdit) return false;
        return this.projectCommandRepository.delete(id);
    }
}
