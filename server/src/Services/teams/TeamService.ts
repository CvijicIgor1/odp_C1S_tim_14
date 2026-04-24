import { ITeamService } from "../../Domain/services/teams/ITeamService";
import { ITeamRepository } from '../../Domain/repositories/teams/ITeamRepository';
import { AddMemberDto } from "../../Domain/DTOs/teams/AddMemberDto";
import { CreateTeamDto } from "../../Domain/DTOs/teams/CreateTeamDto";
import { UpdateMemberRoleDto } from "../../Domain/DTOs/teams/UpdateMemberRoleDto";
import { UpdateTeamDto } from "../../Domain/DTOs/teams/UpdateTeamDto";
import { Team } from "../../Domain/models/Team";
import { TeamMember } from "../../Domain/models/TeamMember";
import { PaginatedListDto } from '../../Domain/DTOs/entity/PaginatedListDto';
import { TeamDto } from "../../Domain/DTOs/teams/TeamDto";

export class TeamService implements ITeamService {
    public constructor(
        private readonly teamRepo: ITeamRepository
        //private readonly auditService: IAuditService  //fali nam audit service! TODO: dodati ga posle 
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

    async getAll(userId: number, page: number, limit: number): Promise<PaginatedListDto<TeamDto>> {
        const { teams, totalNumber } = await this.teamRepo.findAll(userId);
        return new PaginatedListDto(teams.map((o) => this.toDto(o)), totalNumber, page, limit);
    }
    async getWithTeamId(teamId: number, userId: number, isAdmin: boolean): Promise<Team> {
        const foundTeam = await this.teamRepo.findById(teamId);
        if (foundTeam != null) {
            return foundTeam;
        }                                               //TODO dodaj admin proveru, nemamo to i dalje
        return new Team();
    }

    async createNewTeam(dto: CreateTeamDto, userId: number): Promise<TeamDto> {
        const created = await this.teamRepo.create(dto, userId);
        if (created.id === 0) return new TeamDto();
        return this.toDto(created);  //ima manje posla nego kod Almondovog CreateOrder, jer ne moramo da rukujemo brojkama
    }
    updateTeam(teamId: number, dto: UpdateTeamDto, userId: number): Promise<Team | null> {
        throw new Error("Method not implemented.");
    }
    deleteTeam(teamId: number, userId: number): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    getTeamMembers(teamId: number, userId: number): Promise<TeamMember[]> {
        throw new Error("Method not implemented.");
    }
    addTeamMember(teamId: number, dto: AddMemberDto, userId: number): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    removeTeamMember(teamId: number, memberId: number, userId: number): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    updateMemberRole(teamId: number, memberId: number, dto: UpdateMemberRoleDto, callerId: number): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
} 