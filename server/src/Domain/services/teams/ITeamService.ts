import { AddMemberDto } from "../../DTOs/teams/AddMemberDto";
import { CreateTeamDto } from "../../DTOs/teams/CreateTeamDto";
import { UpdateMemberRoleDto } from "../../DTOs/teams/UpdateMemberRoleDto";
import { UpdateTeamDto } from "../../DTOs/teams/UpdateTeamDto";
import { Team } from "../../models/Team";
import { TeamMember } from "../../models/TeamMember";

export interface ITeamService {
    getAll(userId: number): Promise<Team[]>;
    getMyTeams(teamId: number, userId: number): Promise<Team | null>;
    createNewTeam(dto: CreateTeamDto, userId: number): Promise<Team>;
    updateTeam(teamId: number, dto: UpdateTeamDto, userId: number): Promise<Team | null>;
    deleteTeam(teamId: number, userId: number): Promise<boolean>;
    getTeamMembers(teamId: number, userId: number): Promise<TeamMember[]>;
    addTeamMember(teamId: number, dto: AddMemberDto, userId: number): Promise<boolean>;
    removeTeamMember(teamId: number, memberId: number, userId: number): Promise<boolean>;
    updateMemberRole(teamId: number, memberId: number, dto: UpdateMemberRoleDto, callerId: number): Promise<boolean>;
}