import { PaginatedListDto } from "../../DTOs/paginatedList/PaginatedListDto";
import { TeamDto } from "../../DTOs/teams/TeamDto";
import { TeamMemberDto } from "../../DTOs/teams/TeamMemberDto";

export interface ITeamReadService {
    getAll(userId: number, page: number, limit: number): Promise<PaginatedListDto<TeamDto>>;
    getAllAsAdmin(userId: number, page: number, limit: number, isAdmin: boolean): Promise<PaginatedListDto<TeamDto>>;
    getWithTeamId(teamId: number, userId: number, isAdmin: boolean): Promise<TeamDto>;
    getTeamMembers(teamId: number, page: number, limit: number, userId: number): Promise<PaginatedListDto<TeamMemberDto>>;
    countOwners(teamId: number): Promise<number>;
}
