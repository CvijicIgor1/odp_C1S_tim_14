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

    async checkOwnerOrAdmin(projectId: number, userId: number, isAdmin: boolean): Promise<boolean> 
    {
        if (isAdmin) return true; // globalni admin je najvisi u hijerarhiji
        return this.projectRepository.isTeamOwner(projectId, userId);
    }

    async getTeamProjects(teamId: number, userId: number, page: number, limit: number, filters?: ProjectFilters): Promise<PaginatedListDto<ProjectDto>> 
    {
        const { projects, totalNumber } = await this.projectRepository.findAllByTeam(teamId, filters);

        // Za svaki projekat hvatam njegove tagove — da frontend može to da izfiltrira
        const dtos = await Promise.all(projects.map(async (project) => {
            const tags = await this.projectRepository.getTagsForProject(project.id);
            const watcherCount = await this.projectRepository.getWatcherCount(project.id);
            return this.toDto(project, tags , watcherCount);
        }));

        return new PaginatedListDto<ProjectDto>(dtos, totalNumber);
    }

    async getProjectById(id: number, userId: number): Promise<ProjectDto> 
    {
        const project = await this.projectRepository.findById(id);
        if (!project || project.id === 0) return new ProjectDto();
 
        const tags = await this.projectRepository.getTagsForProject(id);
        const watcherCount = await this.projectRepository.getWatcherCount(id);
        return this.toDto(project, tags, watcherCount);
    }

    async createProject(teamId: number, dto: CreateProjectDto, userId: number): Promise<ProjectDto> 
    {
        const created = await this.projectRepository.create(teamId, dto);
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

    async updateProject(id: number, dto: UpdateProjectDto, userId: number,isAdmin: boolean = false): Promise<boolean> 
    {
        const canEdit = await this.checkOwnerOrAdmin(id, userId, isAdmin); // proverava da li je admin/owner ako jeste poziva repo ako ne vraca false
        if (!canEdit) return false;
        return this.projectRepository.update(id, dto);
    }

    async deleteProject(id: number, userId: number, isAdmin: boolean = false): Promise<boolean> 
    {
        const canEdit = await this.checkOwnerOrAdmin(id, userId, isAdmin);
        if (!canEdit) return false;
        return this.projectRepository.delete(id);
    }

    async addTag(projectId: number, tagId: number, userId: number, isAdmin: boolean = false): Promise<boolean> 
    {
        const canEdit = await this.checkOwnerOrAdmin(projectId, userId, isAdmin);
        if (!canEdit) return false;
        return this.projectRepository.addTag(projectId, tagId);
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
        const { projects, totalNumber } = await this.projectRepository.findWatchedByUser(userId);
 
        const dtos = await Promise.all(
            projects.map(async (p) => {
                const tags = await this.projectRepository.getTagsForProject(p.id);
                const watcherCount = await this.projectRepository.getWatcherCount(p.id);
                return this.toDto(p, tags, watcherCount);
            })
        );
 
        return new PaginatedListDto(dtos, totalNumber, page, limit);
    }
     
}