import { IProjectTagWatchService } from "../../Domain/services/projects/IProjectTagWatchService";
import { IProjectTagRepository } from "../../Domain/repositories/projects/IProjectTagRepository";
import { IProjectWatcherRepository } from "../../Domain/repositories/projects/IProjectWatcherRepository";
import { IProjectAccessRepository } from "../../Domain/repositories/projects/IProjectAccessRepository";
import { AddTagResult } from "../../Domain/enums/AddTagResult";

export class ProjectTagWatchService implements IProjectTagWatchService {
    public constructor(
        private readonly projectTagRepository: IProjectTagRepository,
        private readonly projectWatcherRepository: IProjectWatcherRepository,
        private readonly projectAccessRepository: IProjectAccessRepository,
    ) {}

    private async checkOwnerOrAdmin(projectId: number, userId: number, isAdmin: boolean): Promise<boolean> {
        if (isAdmin) return true;
        return this.projectAccessRepository.isTeamOwner(projectId, userId);
    }

    async addTag(projectId: number, tagId: number, userId: number, isAdmin: boolean = false): Promise<AddTagResult> {
        const canEdit = await this.checkOwnerOrAdmin(projectId, userId, isAdmin);
        if (!canEdit) return AddTagResult.FORBIDDEN;
        const existing = await this.projectTagRepository.getTagsForProject(projectId);
        if (existing.some((t) => t.id === tagId)) return AddTagResult.DUPLICATE;
        await this.projectTagRepository.addTag(projectId, tagId);
        return AddTagResult.OK;
    }

    async removeTag(projectId: number, tagId: number, userId: number, isAdmin: boolean = false): Promise<boolean> {
        const canEdit = await this.checkOwnerOrAdmin(projectId, userId, isAdmin);
        if (!canEdit) return false;
        return this.projectTagRepository.removeTag(projectId, tagId);
    }

    async watchProject(projectId: number, userId: number): Promise<boolean> {
        const isMember = await this.projectAccessRepository.isTeamMember(projectId, userId);
        if (!isMember) return false;

        const alreadyWatcher = await this.projectWatcherRepository.isWatcher(projectId, userId);
        if (alreadyWatcher) return true;

        return this.projectWatcherRepository.addWatcher(projectId, userId);
    }

    async unwatchProject(projectId: number, userId: number): Promise<boolean> {
        return this.projectWatcherRepository.removeWatcher(projectId, userId);
    }
}
