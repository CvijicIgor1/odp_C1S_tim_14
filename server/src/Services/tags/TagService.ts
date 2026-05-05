import { ITagRepository } from "../../Domain/repositories/tags/ITagsRepository";
import { ITagService } from "../../Domain/services/tags/ITagService";
import { PaginatedListDto } from "../../Domain/DTOs/entity/PaginatedListDto";
import { CreateTagDto } from "../../Domain/DTOs/tags/CreateTagDto";
import { TagDto } from "../../Domain/DTOs/tags/TagDto";
import { Tag } from "../../Domain/models/Tag";

export class TagService implements ITagService {
    public constructor(
        private readonly tagRepo: ITagRepository
        //private readonly auditService: IAuditService fali ovde
    ) { }

    private tagToDto(tag: Tag): TagDto {
        return new TagDto(
            tag.id,
            tag.name,
        );
    }

    async getAll(page: number, limit: number): Promise<PaginatedListDto<TagDto>> {
        const { tags, totalNumber } = await this.tagRepo.findAllTags();
        return new PaginatedListDto(tags.map((o) => this.tagToDto(o)), totalNumber, page, limit);
    }

    async create(dto: CreateTagDto): Promise<TagDto> {
        const createdTag = await this.tagRepo.createNewTag(dto);
        if (createdTag.id === 0) return new TagDto();
        return this.tagToDto(createdTag);
    }

    async delete(tagId: number): Promise<boolean> {
        return this.tagRepo.deleteTag(tagId);
    }
}