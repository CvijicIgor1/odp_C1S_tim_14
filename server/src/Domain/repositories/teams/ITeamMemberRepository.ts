import { TeamMember } from '../../models/TeamMember';

export interface ITeamMemberRepository {
    addMember(teamId: number, noviClan: TeamMember): Promise<boolean>;
    removeMember(teamId: number, memberId: number): Promise<boolean>;
    countOwners(teamId: number): Promise<number>;
    isOwner(teamId: number, userId: number): Promise<boolean>;
}
