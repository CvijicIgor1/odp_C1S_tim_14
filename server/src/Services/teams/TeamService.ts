import { ITeamService } from "../../Domain/services/teams/ITeamService";
import { ITeamRepository } from '../../Domain/repositories/teams/ITeamRepository';
import { AddMemberDto } from "../../Domain/DTOs/teams/AddMemberDto";
import { CreateTeamDto } from "../../Domain/DTOs/teams/CreateTeamDto";
import { UpdateMemberRoleDto } from "../../Domain/DTOs/teams/UpdateMemberRoleDto";
import { UpdateTeamDto } from "../../Domain/DTOs/teams/UpdateTeamDto";
import { Team } from "../../Domain/models/Team";
import { TeamMember } from "../../Domain/models/TeamMember";

export class TeamService implements ITeamService{
    public constructor(
    private readonly teamRepo: ITeamRepository
    //private readonly auditService: IAuditService  //fali nam audit service! TODO: dodati ga posle 
    ) {}
    getAll(userId: number): Promise<Team[]> {
        throw new Error("Method not implemented.");
    }
    getMyTeams(teamId: number, userId: number): Promise<Team | null> {
        throw new Error("Method not implemented.");
    }
    createNewTeam(dto: CreateTeamDto, userId: number): Promise<Team> {
        throw new Error("Method not implemented.");
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