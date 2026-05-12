import { Tag } from "../../models/Tag";

export interface ITagRepository{
    createNewTag(newTag: Tag): Promise<Tag>;
    deleteTag(tagId: number): Promise<boolean>;
    findAllTags(page: number, limit: number): Promise<{tags: Tag[], totalNumber: number}>;
}