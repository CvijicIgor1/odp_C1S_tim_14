export interface IProjectWatcherRepository {
    addWatcher(projectId: number, userId: number): Promise<boolean>;
    removeWatcher(projectId: number, userId: number): Promise<boolean>;
    isWatcher(projectId: number, userId: number): Promise<boolean>;
    getWatcherCount(projectId: number): Promise<number>;
    getWatcherCounts(projectIds: number[]): Promise<Map<number, number>>;
}
