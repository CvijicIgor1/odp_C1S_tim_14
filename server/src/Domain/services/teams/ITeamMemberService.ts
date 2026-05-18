import { TeamOperationResult } from "../../enums/TeamOperationResult";
import { UpdateRoleResult } from "../../enums/UpdateRoleResult";
import { AddMemberDto } from "../../DTOs/teams/AddMemberDto";
import { UpdateMemberRoleDto } from "../../DTOs/teams/UpdateMemberRoleDto";

export interface ITeamMemberService {
    addTeamMember(teamId: number, dto: AddMemberDto, userId: number, isAdmin?: boolean): Promise<TeamOperationResult>;
    removeTeamMember(teamId: number, memberId: number, userId: number, isAdmin?: boolean): Promise<TeamOperationResult>;
    updateMemberRole(teamId: number, memberId: number, dto: UpdateMemberRoleDto, callerId: number, isAdmin?: boolean): Promise<UpdateRoleResult>;
}
