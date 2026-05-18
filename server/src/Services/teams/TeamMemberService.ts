import { ITeamMemberService } from "../../Domain/services/teams/ITeamMemberService";
import { ITeamCommandRepository } from '../../Domain/repositories/teams/ITeamCommandRepository';
import { ITeamMemberRepository } from '../../Domain/repositories/teams/ITeamMemberRepository';
import { ITeamQueryRepository } from "../../Domain/repositories/teams/ITeamQueryRepository";
import { IAuditService } from "../../Domain/services/audit/IAuditService";
import { AuditAction } from "../../Domain/enums/AuditLog";
import { TeamOperationResult } from "../../Domain/enums/TeamOperationResult";
import { UpdateRoleResult } from "../../Domain/enums/UpdateRoleResult";
import { AddMemberDto } from "../../Domain/DTOs/teams/AddMemberDto";
import { UpdateMemberRoleDto } from "../../Domain/DTOs/teams/UpdateMemberRoleDto";
import { TeamMember } from "../../Domain/models/TeamMember";
import { TeamMemberRole } from "../../Domain/enums/TeamMemberRole";

export class TeamMemberService implements ITeamMemberService {
    public constructor(
        private readonly teamCommandRepository: ITeamCommandRepository,
        private readonly teamMemberRepository: ITeamMemberRepository,
        private readonly teamQueryRepository: ITeamQueryRepository,
        private readonly auditService: IAuditService,
    ) {}

    private async getOwnerCount(teamId: number): Promise<number> {
        const members = await this.teamQueryRepository.getMembers(teamId);
        return members.members.filter((member) => member.role === TeamMemberRole.OWNER).length;
    }

    private async isTeamOwner(teamId: number, userId: number): Promise<boolean> {
        const members = await this.teamQueryRepository.getMembers(teamId);
        return members.members.some((member) => member.userId === userId && member.role === TeamMemberRole.OWNER);
    }

    async addTeamMember(teamId: number, dto: AddMemberDto, userId: number, isAdmin: boolean = false): Promise<TeamOperationResult> {
        const isOwner = isAdmin || await this.isTeamOwner(teamId, userId);
        if (!isOwner) return TeamOperationResult.Forbidden;
        const newMember = new TeamMember(0, 0, dto.role, new Date(), dto.username);
        const ok = await this.teamMemberRepository.addMember(teamId, newMember);
        if (!ok) return TeamOperationResult.NotFound;
        await this.auditService.log(userId, AuditAction.CREATE, "team_member", teamId);
        return TeamOperationResult.Success;
    }

    async removeTeamMember(teamId: number, memberId: number, userId: number, isAdmin: boolean = false): Promise<TeamOperationResult> {
        const isOwner = isAdmin || await this.isTeamOwner(teamId, userId);
        const isSelfRemoval = memberId === userId;
        if (!isOwner && !isSelfRemoval) return TeamOperationResult.Forbidden;

        const ownerCount = await this.getOwnerCount(teamId);
        if (ownerCount <= 1) {
            const memberIsOwner = await this.isTeamOwner(teamId, memberId);
            if (memberIsOwner) return TeamOperationResult.LastOwner;
        }
        const ok = await this.teamMemberRepository.removeMember(teamId, memberId);
        if (!ok) return TeamOperationResult.NotFound;
        await this.auditService.log(userId, AuditAction.DELETE, "team_member", memberId);
        return TeamOperationResult.Success;
    }

    async updateMemberRole(teamId: number, memberId: number, dto: UpdateMemberRoleDto, callerId: number, isAdmin: boolean = false): Promise<UpdateRoleResult> {
        const isOwner = isAdmin || await this.isTeamOwner(teamId, callerId);
        if (!isOwner) return UpdateRoleResult.Forbidden;

        if (dto.role === TeamMemberRole.MEMBER) {
            const ownerCount = await this.getOwnerCount(teamId);
            if (ownerCount <= 1) return UpdateRoleResult.LastOwner;
        }

        const updated = await this.teamCommandRepository.updateMemberRole(teamId, memberId, dto.role);
        if (!updated) return UpdateRoleResult.NotFound;
        await this.auditService.log(callerId, AuditAction.UPDATE, "team_member", memberId);
        return UpdateRoleResult.Success;
    }
}
