import { IProjectService } from "../../Domain/services/projects/IProjectService";
import { IProjectRepository } from "../../Domain/repositories/projects/IProjectRepository";
import { CreateProjectDto } from "../../Domain/DTOs/projects/CreateProjectDto";
import { UpdateProjectDto } from "../../Domain/DTOs/projects/UpdateProjectDto";
import { ProjectDto} from "../../Domain/DTOs/projects/ProjectDto";
import { PaginatedListDto } from "../../Domain/DTOs/entity/PaginatedListDto";
import { ProjectFilters } from "../../Domain/types/ProjectFilters";
import { Project } from "../../Domain/models/Project";
import { Tag } from "../../Domain/models/Tag";
import { TagDto } from "../../Domain/DTOs/tags/TagDto";
import { AddTagResult } from "../../Domain/enums/AddTagResult";

export class ProjectService implements IProjectService
{
    public constructor
    (
        private readonly projectRepository: IProjectRepository,
    ) {}

    private toDto(project: Project, tags: Tag[], watcherCount: number): ProjectDto 
    {
        return new ProjectDto
        (
            project.id,
            project.teamId,
            project.name,
            project.description,
            project.status,
            project.priority,
            project.deadline,
            tags.map((t) => new TagDto(t.id, t.name)),
            watcherCount,              // watcherCount realno trenutno mi ne treba, ali i ne smeta
            project.createdAt,
            project.updatedAt,
        )
    }

    private async checkOwnerOrAdmin(projectId: number, userId: number, isAdmin: boolean): Promise<boolean> 
    {
        if (isAdmin) return true; // globalni admin je najvisi u hijerarhiji
        return this.projectRepository.isTeamOwner(projectId, userId);
    }

    async getTeamProjects(teamId: number, userId: number, page: number, limit: number, filters?: ProjectFilters): Promise<PaginatedListDto<ProjectDto>> 
    {
        const { projects: paged, totalNumber } = await this.projectRepository.findAllByTeam(teamId, page, limit, filters);

        const ids = paged.map((p) => p.id);
        const [tagsMap, countsMap] = await Promise.all([
            this.projectRepository.getTagsForProjects(ids),
            this.projectRepository.getWatcherCounts(ids),
        ]);

        const dtos = paged.map((project) =>
            this.toDto(
                project,
                tagsMap.get(project.id) ?? [],
                countsMap.get(project.id) ?? 0,
            )
        );

        return new PaginatedListDto<ProjectDto>(dtos, totalNumber, page, limit);
    }

    async getAllProjectsAsAdmin(page: number, limit: number): Promise<PaginatedListDto<ProjectDto>>
    {
        const { projects, totalNumber } = await this.projectRepository.findAllAsAdmin(page, limit);

        const ids = projects.map((p) => p.id);
        const [tagsMap, countsMap] = await Promise.all([
            this.projectRepository.getTagsForProjects(ids),
            this.projectRepository.getWatcherCounts(ids),
        ]);

        const dtos = projects.map((project) =>
            this.toDto(
                project,
                tagsMap.get(project.id) ?? [],
                countsMap.get(project.id) ?? 0,
            )
        );

        return new PaginatedListDto<ProjectDto>(dtos, totalNumber, page, limit);
    }
    async getProjectById(id: number, userId: number, isAdmin: boolean = false): Promise<ProjectDto> 
    {
        const project = await this.projectRepository.findById(id);
        if (!project || project.id === 0) return new ProjectDto();
 
        if (!isAdmin) {
            const isMember = await this.projectRepository.isTeamMember(id, userId);
            if (!isMember) return new ProjectDto();
        }

        const tags = await this.projectRepository.getTagsForProject(id);
        const watcherCount = await this.projectRepository.getWatcherCount(id);
        return this.toDto(project, tags, watcherCount);
    }

    async createProject(teamId: number, dto: CreateProjectDto, userId: number): Promise<ProjectDto> 
    {
        if(dto.deadline){
        const newProject = new Project(0, 0, dto.name, dto.description, dto.status, dto.priority, new Date(dto.deadline), new Date(), new Date());
        const created = await this.projectRepository.create(teamId, newProject);
        if (created.id === 0) return new ProjectDto();
        

        if (dto.tagIds && dto.tagIds.length > 0) {
            await Promise.all(
                dto.tagIds.map((tagId) => this.projectRepository.addTag(created.id, tagId))
            );
        }

        const tags = await this.projectRepository.getTagsForProject(created.id);
        const watcherCount = 0; // novi projekat, nema pratilaca
        return this.toDto(created, tags, watcherCount);

        }
        else return new ProjectDto();
    }

    async updateProject(id: number, dto: UpdateProjectDto, userId: number,isAdmin: boolean = false): Promise<boolean> 
    {
        if(dto.deadline){
        const inputProject = new Project(0, 0, dto.name, dto.description, dto.status, dto.priority, new Date(dto.deadline), new Date(), new Date());
        const canEdit = await this.checkOwnerOrAdmin(id, userId, isAdmin); // proverava da li je admin/owner ako jeste poziva repo ako ne vraca false
        if (!canEdit) return false;
        return this.projectRepository.update(id, inputProject);
        }
        else return false;
    }

    async deleteProject(id: number, userId: number, isAdmin: boolean = false): Promise<boolean> 
    {
        const canEdit = await this.checkOwnerOrAdmin(id, userId, isAdmin);
        if (!canEdit) return false;
        return this.projectRepository.delete(id);
    }

    async addTag(projectId: number, tagId: number, userId: number, isAdmin: boolean = false): Promise<AddTagResult> 
    {
        const canEdit = await this.checkOwnerOrAdmin(projectId, userId, isAdmin);
        if (!canEdit) return AddTagResult.FORBIDDEN;
        const existing = await this.projectRepository.getTagsForProject(projectId);
        if (existing.some((t) => t.id === tagId)) return AddTagResult.DUPLICATE;
        await this.projectRepository.addTag(projectId, tagId);
        return AddTagResult.OK;
    }
 
    async removeTag(projectId: number, tagId: number, userId: number, isAdmin: boolean = false): Promise<boolean> 
    {
        const canEdit = await this.checkOwnerOrAdmin(projectId, userId, isAdmin);
        if (!canEdit) return false;
        return this.projectRepository.removeTag(projectId, tagId);
    }

    async watchProject(projectId: number, userId: number): Promise<boolean>
    {
        const isMember = await this.projectRepository.isTeamMember(projectId, userId);
        if (!isMember) return false;

        const alreadyWatcher = await this.projectRepository.isWatcher(projectId, userId);
        if (alreadyWatcher) return true;

        return this.projectRepository.addWatcher(projectId, userId);
    }

    async unwatchProject(projectId: number, userId: number): Promise<boolean> 
    {
        return this.projectRepository.removeWatcher(projectId, userId);
    }

    
    async getWatchedProjects(userId: number, page: number, limit: number): Promise<PaginatedListDto<ProjectDto>> 
    {
        const { projects: paged, totalNumber } = await this.projectRepository.findWatchedByUser(userId, page, limit);

        const ids = paged.map((p) => p.id);
        const [tagsMap, countsMap] = await Promise.all([
            this.projectRepository.getTagsForProjects(ids),
            this.projectRepository.getWatcherCounts(ids),
        ]);

        const dtos = paged.map((p) =>
            this.toDto(
                p,
                tagsMap.get(p.id) ?? [],
                countsMap.get(p.id) ?? 0,
            )
        );
 
        return new PaginatedListDto(dtos, totalNumber, page, limit);
    }
     
}