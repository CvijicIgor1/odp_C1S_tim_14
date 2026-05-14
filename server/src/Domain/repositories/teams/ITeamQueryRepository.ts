import { Team } from "../../models/Team";
import { TeamMember } from '../../models/TeamMember';

export interface ITeamQueryRepository {
    findAll(userId: number): Promise<{ teams: Array<{ team: Team; role: string }>; totalNumber: number }>;
    findAllAsAdmin(): Promise<{ teams: Team[]; totalNumber: number }>;
    findById(teamId: number): Promise<Team | null>;
    getMembers(teamId: number): Promise<{ members: TeamMember[]; totalNumber: number }>;
}
