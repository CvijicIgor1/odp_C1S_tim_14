import { PaginatedListDto } from "../../DTOs/entity/PaginatedListDto"
import { CreateTagDto } from "../../DTOs/tags/CreateTagDto";
import { TagDto } from "../../DTOs/tags/TagDto"

export interface ITagService{
    getAll(page: number, limit: number): Promise<PaginatedListDto<TagDto>>;
    create(dto: CreateTagDto): Promise<TagDto>;
    delete(tagId: number): Promise<boolean>;
}