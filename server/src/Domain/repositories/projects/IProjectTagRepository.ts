import { Tag } from "../../models/Tag";

export interface IProjectTagRepository {
    addTag(projectId: number, tagId: number): Promise<boolean>;
    removeTag(projectId: number, tagId: number): Promise<boolean>;
    getTagsForProject(projectId: number): Promise<Tag[]>;
    getTagsForProjects(projectIds: number[]): Promise<Map<number, Tag[]>>;
}
