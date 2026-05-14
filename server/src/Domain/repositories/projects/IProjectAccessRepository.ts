export interface IProjectAccessRepository {
    isTeamMember(projectId: number, userId: number): Promise<boolean>;
    isTeamOwner(projectId: number, userId: number): Promise<boolean>;
}
