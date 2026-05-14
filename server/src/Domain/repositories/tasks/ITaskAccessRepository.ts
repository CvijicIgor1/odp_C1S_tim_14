export interface ITaskAccessRepository {
    isUserInProjectTeam(projectId: number, userId: number): Promise<boolean>;
    isTeamOwnerOfTask(taskId: number, userId: number): Promise<boolean>;
}
