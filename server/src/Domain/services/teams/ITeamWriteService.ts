import { TeamOperationResult } from "../../enums/TeamOperationResult";
import { CreateTeamDto } from "../../DTOs/teams/CreateTeamDto";
import { TeamDto } from "../../DTOs/teams/TeamDto";
import { UpdateTeamDto } from "../../DTOs/teams/UpdateTeamDto";

export interface ITeamWriteService {
    createNewTeam(dto: CreateTeamDto, userId: number): Promise<TeamDto>;
    updateTeam(teamId: number, dto: UpdateTeamDto, userId: number, isAdmin?: boolean): Promise<TeamOperationResult>;
    deleteTeam(teamId: number, userId: number, isAdmin?: boolean): Promise<TeamOperationResult>;
}
