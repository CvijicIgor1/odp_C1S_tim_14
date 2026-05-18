import { ITeamReadService } from "../../Domain/services/teams/ITeamReadService";
import { ITeamQueryRepository } from '../../Domain/repositories/teams/ITeamQueryRepository';
import { ITeamMemberRepository } from '../../Domain/repositories/teams/ITeamMemberRepository';
import { IUserQueryRepository } from '../../Domain/repositories/users/IUserQueryRepository';
import { PaginatedListDto } from '../../Domain/DTOs/paginatedList/PaginatedListDto';
import { TeamDto } from "../../Domain/DTOs/teams/TeamDto";
import { TeamMemberDto } from "../../Domain/DTOs/teams/TeamMemberDto";
import { Team } from "../../Domain/models/Team";
import { TeamMember } from "../../Domain/models/TeamMember";
import { TeamMemberRole } from "../../Domain/enums/TeamMemberRole";

export class TeamReadService implements ITeamReadService {
    public constructor(
        private readonly teamQueryRepository: ITeamQueryRepository,
        private readonly teamMemberRepository: ITeamMemberRepository,
        private readonly userQueryRepository: IUserQueryRepository,
    ) {}

    private toDto(team: Team, role: TeamMemberRole = TeamMemberRole.MEMBER): TeamDto {
        return new TeamDto(team.id, team.name, team.description, team.avatar, team.updatedAt, team.createdAt, role);
    }

    private toMemberDto(member: TeamMember, username: string): TeamMemberDto {
        return new TeamMemberDto(member.teamId, member.userId, member.role, member.joinedAt, username);
    }

    async getAll(userId: number, page: number, limit: number): Promise<PaginatedListDto<TeamDto>> {
        const { teams, totalNumber } = await this.teamQueryRepository.findAll(userId);
        return new PaginatedListDto(
            teams.map(({ team, role }) => this.toDto(team, role as TeamMemberRole)),
            totalNumber,
            page,
            limit
        );
    }

    async getAllAsAdmin(userId: number, page: number, limit: number, isAdmin: boolean): Promise<PaginatedListDto<TeamDto>> {
        if (isAdmin) {
            const { teams, totalNumber } = await this.teamQueryRepository.findAllAsAdmin();
            return new PaginatedListDto(teams.map((o) => this.toDto(o)), totalNumber, page, limit);
        }
        return new PaginatedListDto<TeamDto>;
    }

    async getWithTeamId(teamId: number, userId: number, isAdmin: boolean): Promise<TeamDto> {
        const team = await this.teamQueryRepository.findById(teamId);
        if (!team) return new TeamDto();

        const { members } = await this.teamQueryRepository.getMembers(teamId);
        const isMember = members.some((m) => m.userId === userId);

        if (!isAdmin && !isMember) return new TeamDto();
        return this.toDto(team);
    }

    async getTeamMembers(teamId: number, page: number, limit: number, userId: number): Promise<PaginatedListDto<TeamMemberDto>> {
        const { members, totalNumber } = await this.teamQueryRepository.getMembers(teamId);
        const offset = (page - 1) * limit;
        const paginated = members.slice(offset, offset + limit);

        const memberDtos = await Promise.all(
            paginated.map(async (m) => {
                const user = await this.userQueryRepository.findById(m.userId);
                return this.toMemberDto(m, user?.username ?? "");
            })
        );

        return new PaginatedListDto(memberDtos, totalNumber, page, limit);
    }

    async countOwners(teamId: number): Promise<number> {
        return this.teamMemberRepository.countOwners(teamId);
    }
}
