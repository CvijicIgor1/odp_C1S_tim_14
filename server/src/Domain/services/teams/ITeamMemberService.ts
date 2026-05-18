import { TeamOperationResult } from "../../enums/TeamOperationResult";
import { UpdateRoleResult } from "../../enums/UpdateRoleResult";
import { AddMemberDto } from "../../DTOs/teams/AddMemberDto";
import { UpdateMemberRoleDto } from "../../DTOs/teams/UpdateMemberRoleDto";

export interface ITeamMemberService {
    addTeamMember(teamId: number, dto: AddMemberDto, userId: number): Promise<TeamOperationResult>;
    removeTeamMember(teamId: number, memberId: number, userId: number): Promise<TeamOperationResult>;
    updateMemberRole(teamId: number, memberId: number, dto: UpdateMemberRoleDto, callerId: number): Promise<UpdateRoleResult>;
}
