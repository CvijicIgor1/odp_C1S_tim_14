import { PaginatedListDto } from "../../DTOs/entity/PaginatedListDto";
import { AddMemberDto } from "../../DTOs/teams/AddMemberDto";
import { CreateTeamDto } from "../../DTOs/teams/CreateTeamDto";
import { TeamDto } from "../../DTOs/teams/TeamDto";
import { UpdateMemberRoleDto } from "../../DTOs/teams/UpdateMemberRoleDto";
import { UpdateTeamDto } from "../../DTOs/teams/UpdateTeamDto";
import { Team } from "../../models/Team";
import { TeamMember } from "../../models/TeamMember";

export interface ITeamService {
    getAll(userId: number, page:number, limit: number): Promise<PaginatedListDto<TeamDto>>;
    getWithTeamId(teamId: number, userId: number, isAdmin: boolean): Promise<Team | null>;
    createNewTeam(dto: CreateTeamDto, userId: number): Promise<TeamDto>;
    updateTeam(teamId: number, dto: UpdateTeamDto, userId: number): Promise<boolean>;
    deleteTeam(teamId: number, userId: number): Promise<boolean>;
    getTeamMembers(teamId: number, userId: number): Promise<TeamMember[]>;
    addTeamMember(teamId: number, dto: AddMemberDto, userId: number): Promise<boolean>;
    removeTeamMember(teamId: number, memberId: number, userId: number): Promise<boolean>;
    updateMemberRole(teamId: number, memberId: number, dto: UpdateMemberRoleDto, callerId: number): Promise<boolean>;
}