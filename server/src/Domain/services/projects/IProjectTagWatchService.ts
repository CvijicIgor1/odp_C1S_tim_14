import { AddTagResult } from '../../enums/AddTagResult';

export interface IProjectTagWatchService {
    addTag(projectId: number, tagId: number, userId: number, isAdmin?: boolean): Promise<AddTagResult>;
    removeTag(projectId: number, tagId: number, userId: number, isAdmin?: boolean): Promise<boolean>;
    watchProject(projectId: number, userId: number): Promise<boolean>;
    unwatchProject(projectId: number, userId: number): Promise<boolean>;
}
