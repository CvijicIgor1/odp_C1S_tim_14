import { TeamMember } from '../../models/TeamMember';

export interface ITeamMemberRepository {
    addMember(teamId: number, noviClan: TeamMember): Promise<boolean>;
    removeMember(teamId: number, memberId: number): Promise<boolean>;
}
