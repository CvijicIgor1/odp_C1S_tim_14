import { Team } from "../../models/Team";
import { TeamMemberRole } from '../../enums/TeamMemberRole';

export interface ITeamCommandRepository {
    create(noviTeam: Team, ownerId: number): Promise<Team>;
    update(teamId: number, inputTeam: Team): Promise<boolean>;
    delete(teamId: number): Promise<boolean>;
    updateMemberRole(teamId: number, memberId: number, novaUloga: TeamMemberRole): Promise<boolean>;
}
