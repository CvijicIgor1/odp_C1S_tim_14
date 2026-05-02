import { ITeamService } from "../../Domain/services/teams/ITeamService";
import { ITeamRepository } from '../../Domain/repositories/teams/ITeamRepository';
import { IAuditService } from "../../Domain/services/audit/IAuditService";
import { AuditAction } from "../../Domain/enums/AuditLog";
import { AddMemberDto } from "../../Domain/DTOs/teams/AddMemberDto";
import { CreateTeamDto } from "../../Domain/DTOs/teams/CreateTeamDto";
import { UpdateMemberRoleDto } from "../../Domain/DTOs/teams/UpdateMemberRoleDto";
import { UpdateTeamDto } from "../../Domain/DTOs/teams/UpdateTeamDto";
import { Team } from "../../Domain/models/Team";
import { TeamMember } from "../../Domain/models/TeamMember";
import { PaginatedListDto } from '../../Domain/DTOs/entity/PaginatedListDto';
import { TeamDto } from "../../Domain/DTOs/teams/TeamDto";
import { TeamMemberDto } from "../../Domain/DTOs/teams/TeamMemberDto";

export class TeamService implements ITeamService {
    public constructor(
        private readonly teamRepo: ITeamRepository,
        private readonly auditService: IAuditService
    ) { }

    private toDto(team: Team): TeamDto {
        return new TeamDto(
            team.id,
            team.name,
            team.description,
            team.avatar,
            team.updatedAt,
            team.createdAt
        );
    }

    private toMemberDto(member: TeamMember): TeamMemberDto {
        return new TeamMemberDto(
            member.teamId,
            member.userId,
            member.role,
            member.joinedAt
        );
    }

    async getAll(userId: number, page: number, limit: number): Promise<PaginatedListDto<TeamDto>> {
        const { teams, totalNumber } = await this.teamRepo.findAll(userId);
        return new PaginatedListDto(teams.map((o) => this.toDto(o)), totalNumber, page, limit);
    }

    async getAllAsAdmin(userId: number, page: number, limit: number, isAdmin: boolean): Promise<PaginatedListDto<TeamDto>> {
        if(isAdmin){
        const { teams, totalNumber } = await this.teamRepo.findAllAsAdmin();
        return new PaginatedListDto(teams.map((o) => this.toDto(o)), totalNumber, page, limit);
        }
        return new PaginatedListDto<TeamDto>;
    }

    async getWithTeamId(teamId: number, userId: number, isAdmin: boolean): Promise<TeamDto> {
        const team = await this.teamRepo.findById(teamId);

        const {members, totalNumber} = await this.teamRepo.getMembers(teamId);
        var isMember = members.some((m) => m.userId === userId);  

        if (team != null) {
            if (team.id === 0) return new TeamDto();
            if (!isAdmin && !isMember) return new TeamDto(); //ako je clan tima ne mora da bude admin, ako je admin svejedno. Dakle ako nije nijedno, nista
            return this.toDto(team);
        }
        return new TeamDto();
    }

    async createNewTeam(dto: CreateTeamDto, userId: number): Promise<TeamDto> {
        const created = await this.teamRepo.create(dto, userId);
        if (created.id === 0) return new TeamDto();
        await this.auditService.log(userId, AuditAction.CREATE, "team", created.id);
        return this.toDto(created);  //ima manje posla nego kod Almondovog CreateOrder, jer ne moramo da rukujemo brojkama
    }

    async updateTeam(teamId: number, dto: UpdateTeamDto, userId: number): Promise<boolean> {
        return this.teamRepo.update(teamId, dto);
    }

    async deleteTeam(teamId: number, userId: number): Promise<boolean> {
        return await this.teamRepo.delete(teamId);
    }

    async getTeamMembers(teamId: number, page: number, limit: number, userId: number): Promise<PaginatedListDto<TeamMemberDto>> {
        const { members, totalNumber } = await this.teamRepo.getMembers(teamId);
        return new PaginatedListDto(members.map((o) => this.toMemberDto(o)), totalNumber, page, limit);
    }

    async addTeamMember(teamId: number, dto: AddMemberDto, userId: number): Promise<boolean> {
        return await this.teamRepo.addMember(teamId, dto);
    }

    async removeTeamMember(teamId: number, memberId: number, userId: number): Promise<boolean> {
        return await this.teamRepo.removeMember(teamId, memberId);
    }
    async updateMemberRole(teamId: number, memberId: number, dto: UpdateMemberRoleDto, callerId: number): Promise<boolean> {
        return await this.teamRepo.updateMemberRole(teamId, memberId, dto);
    }
} 