import { ITeamService } from "../../Domain/services/teams/ITeamService";
import { ITeamRepository } from '../../Domain/repositories/teams/ITeamRepository';
import { IUserRepository } from '../../Domain/repositories/users/IUserRepository';
import { IAuditService } from "../../Domain/services/audit/IAuditService";
import { AuditAction } from "../../Domain/enums/AuditLog";
import { AddMemberDto } from "../../Domain/DTOs/teams/AddMemberDto";
import { CreateTeamDto } from "../../Domain/DTOs/teams/CreateTeamDto";
import { UpdateMemberRoleDto } from "../../Domain/DTOs/teams/UpdateMemberRoleDto";
import { UpdateTeamDto } from "../../Domain/DTOs/teams/UpdateTeamDto";
import { Team } from "../../Domain/models/Team";
import { TeamMember } from "../../Domain/models/TeamMember";
import { TeamMemberRole } from "../../Domain/enums/TeamMemberRole";
import { PaginatedListDto } from '../../Domain/DTOs/entity/PaginatedListDto';
import { TeamDto } from "../../Domain/DTOs/teams/TeamDto";
import { TeamMemberDto } from "../../Domain/DTOs/teams/TeamMemberDto";

export class TeamService implements ITeamService {
    public constructor(
        private readonly teamRepo: ITeamRepository,
        private readonly auditService: IAuditService,
        private readonly userRepo: IUserRepository
    ) { }

    private toDto(team: Team, role: TeamMemberRole = TeamMemberRole.MEMBER): TeamDto {
        return new TeamDto(
            team.id,
            team.name,
            team.description,
            team.avatar,
            team.updatedAt,
            team.createdAt,
            role
        );
    }

    private toMemberDto(member: TeamMember, username: string): TeamMemberDto {
        return new TeamMemberDto(
            member.teamId,
            member.userId,
            member.role,
            member.joinedAt,
            username
        );
    }

    async getAll(userId: number, page: number, limit: number): Promise<PaginatedListDto<TeamDto>> {
        const { teams, totalNumber } = await this.teamRepo.findAll(userId);
        return new PaginatedListDto(
            teams.map(({ team, role }) => this.toDto(team, role as TeamMemberRole)),
            totalNumber,
            page,
            limit
        );
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
        if (!team) return new TeamDto();

        const {members} = await this.teamRepo.getMembers(teamId);
        const isMember = members.some((m) => m.userId === userId);

        if (!isAdmin && !isMember) return new TeamDto(); //ako je clan tima ne mora da bude admin, ako je admin svejedno. Dakle ako nije nijedno, nista
        return this.toDto(team);
    }

    async createNewTeam(dto: CreateTeamDto, userId: number): Promise<TeamDto> {
        const newTeam = new Team(0, dto.name, dto.description, dto.avatar, new Date(), new Date());
        const created = await this.teamRepo.create(newTeam, userId);
        if (created.id === 0) return new TeamDto();
        await this.auditService.log(userId, AuditAction.CREATE, "team", created.id);
        return this.toDto(created, TeamMemberRole.OWNER);  //ima manje posla nego kod Almondovog CreateOrder, jer ne moramo da rukujemo brojkama
    }

    async updateTeam(teamId: number, dto: UpdateTeamDto, userId: number): Promise<boolean> {
        const input = new Team(0, dto.name, dto.description, dto.avatar, new Date(), new Date());
        return this.teamRepo.update(teamId, input);
    }

    async deleteTeam(teamId: number, userId: number): Promise<boolean> {
        return await this.teamRepo.delete(teamId);
    }

    async getTeamMembers(teamId: number, page: number, limit: number, userId: number): Promise<PaginatedListDto<TeamMemberDto>> {
        const { members, totalNumber } = await this.teamRepo.getMembers(teamId);
        const offset = (page - 1) * limit;
        const paginated = members.slice(offset, offset + limit);

        const memberDtos = await Promise.all(
            paginated.map(async (m) => {
                const user = await this.userRepo.findById(m.userId);
                return this.toMemberDto(m, user?.username ?? "");
            })
        );

        return new PaginatedListDto(memberDtos, totalNumber, page, limit);
    }

    async countOwners(teamId: number): Promise<number> {
        return this.teamRepo.countOwners(teamId);
    }

    async addTeamMember(teamId: number, dto: AddMemberDto, userId: number): Promise<boolean> {
        const noviClan = new TeamMember(0, 0, dto.role, new Date(), dto.username);
        return await this.teamRepo.addMember(teamId, noviClan);
    }

    async removeTeamMember(teamId: number, memberId: number, userId: number): Promise<boolean> {
        return await this.teamRepo.removeMember(teamId, memberId);
    }

    async updateMemberRole(teamId: number, memberId: number, dto: UpdateMemberRoleDto, callerId: number): Promise<boolean> {
        return await this.teamRepo.updateMemberRole(teamId, memberId, dto.role);

    }
} 