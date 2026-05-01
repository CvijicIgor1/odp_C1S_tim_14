import { CreateTagDto } from "../../DTOs/tags/CreateTagDto";
import { Tag } from "../../models/Tag";

export interface ITagRepository{
    createNewTag(dto: CreateTagDto): Promise<Tag>;
    deleteTag(tagId: number): Promise<boolean>;
    findAllTags(): Promise<{tags: Tag[], totalNumber: number}>;
}