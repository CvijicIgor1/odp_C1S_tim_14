import { ITeamWriteService } from "../../Domain/services/teams/ITeamWriteService";
import { ITeamCommandRepository } from '../../Domain/repositories/teams/ITeamCommandRepository';
import { ITeamMemberRepository } from '../../Domain/repositories/teams/ITeamMemberRepository';
import { IAuditService } from "../../Domain/services/audit/IAuditService";
import { AuditAction } from "../../Domain/enums/AuditLog";
import { TeamOperationResult } from "../../Domain/enums/TeamOperationResult";
import { CreateTeamDto } from "../../Domain/DTOs/teams/CreateTeamDto";
import { UpdateTeamDto } from "../../Domain/DTOs/teams/UpdateTeamDto";
import { TeamDto } from "../../Domain/DTOs/teams/TeamDto";
import { Team } from "../../Domain/models/Team";
import { TeamMemberRole } from "../../Domain/enums/TeamMemberRole";

export class TeamWriteService implements ITeamWriteService {
    public constructor(
        private readonly teamCommandRepository: ITeamCommandRepository,
        private readonly teamMemberRepository: ITeamMemberRepository,
        private readonly auditService: IAuditService,
    ) {}

    private toDto(team: Team, role: TeamMemberRole = TeamMemberRole.MEMBER): TeamDto {
        return new TeamDto(team.id, team.name, team.description, team.avatar, team.updatedAt, team.createdAt, role);
    }

    async createNewTeam(dto: CreateTeamDto, userId: number): Promise<TeamDto> {
        const newTeam = new Team(0, dto.name, dto.description, dto.avatar, new Date(), new Date());
        const created = await this.teamCommandRepository.create(newTeam, userId);
        if (created.id === 0) return new TeamDto();
        await this.auditService.log(userId, AuditAction.CREATE, "team", created.id);
        return this.toDto(created, TeamMemberRole.OWNER);
    }

    async updateTeam(teamId: number, dto: UpdateTeamDto, userId: number, isAdmin: boolean = false): Promise<TeamOperationResult> {
        const owner = isAdmin || await this.teamMemberRepository.isOwner(teamId, userId);
        if (!owner) return TeamOperationResult.Forbidden;
        const input = new Team(0, dto.name, dto.description, dto.avatar, new Date(), new Date());
        const ok = await this.teamCommandRepository.update(teamId, input);
        if (!ok) return TeamOperationResult.NotFound;
        await this.auditService.log(userId, AuditAction.UPDATE, "team", teamId);
        return TeamOperationResult.Success;
    }

    async deleteTeam(teamId: number, userId: number, isAdmin: boolean = false): Promise<TeamOperationResult> {
        const owner = isAdmin || await this.teamMemberRepository.isOwner(teamId, userId);
        if (!owner) return TeamOperationResult.Forbidden;
        const ok = await this.teamCommandRepository.delete(teamId);
        if (!ok) return TeamOperationResult.NotFound;
        await this.auditService.log(userId, AuditAction.DELETE, "team", teamId);
        return TeamOperationResult.Success;
    }
}
