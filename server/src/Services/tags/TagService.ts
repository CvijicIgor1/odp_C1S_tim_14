import { ITagRepository } from "../../Domain/repositories/tags/ITagsRepository";
import { ITagService } from "../../Domain/services/tags/ITagService";
import { IAuditService } from "../../Domain/services/audit/IAuditService";
import { AuditAction } from "../../Domain/enums/AuditLog";
import { PaginatedListDto } from "../../Domain/DTOs/paginatedList/PaginatedListDto";
import { CreateTagDto } from "../../Domain/DTOs/tags/CreateTagDto";
import { TagDto } from "../../Domain/DTOs/tags/TagDto";
import { Tag } from "../../Domain/models/Tag";

export class TagService implements ITagService {
    public constructor(
        private readonly tagRepo: ITagRepository,
        private readonly auditService: IAuditService
    ) { }

    private tagToDto(tag: Tag): TagDto {
        return new TagDto(
            tag.id,
            tag.name,
        );
    }

    async getAll(page: number, limit: number): Promise<PaginatedListDto<TagDto>> {
        const { tags, totalNumber } = await this.tagRepo.findAllTags(page, limit);
        return new PaginatedListDto(tags.map((o) => this.tagToDto(o)), totalNumber, page, limit);
    }

    async create(dto: CreateTagDto, userId: number): Promise<TagDto> {
        const newTag = new Tag(0, dto.name);
        const createdTag = await this.tagRepo.createNewTag(newTag);
        if (createdTag.id === 0) return new TagDto();
        await this.auditService.log(userId, AuditAction.CREATE, "tag", createdTag.id);
        return this.tagToDto(createdTag);
    }

    async delete(tagId: number, userId: number): Promise<boolean> {
        const ok = await this.tagRepo.deleteTag(tagId);
        if (ok) await this.auditService.log(userId, AuditAction.DELETE, "tag", tagId);
        return ok;
    }
}