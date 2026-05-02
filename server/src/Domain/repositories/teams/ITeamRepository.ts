import { CreateTeamDto } from '../../DTOs/teams/CreateTeamDto';
import { UpdateTeamDto } from '../../DTOs/teams/UpdateTeamDto';
import { Team } from "../../models/Team";
import { TeamMember } from '../../models/TeamMember';
import { AddMemberDto } from '../../DTOs/teams/AddMemberDto';
import { UpdateMemberRoleDto } from '../../DTOs/teams/UpdateMemberRoleDto';


export interface ITeamRepository {
  findAll(userId: number): Promise<{teams: Team[], totalNumber: number}>;
  findAllAsAdmin(): Promise<{ teams: Team[], totalNumber: number }>;
  findById(teamId: number): Promise<Team | null>;
  create(dto: CreateTeamDto, ownerId: number): Promise<Team>;
  update(teamId: number, dto: UpdateTeamDto): Promise<boolean>;
  delete(teamId: number): Promise<boolean>;
  getMembers(teamId: number): Promise<{members: TeamMember[], totalNumber: number}>;
  addMember(teamId: number, dto: AddMemberDto): Promise<boolean>;
  removeMember(teamId: number, memberId: number): Promise<boolean>;
  updateMemberRole(teamId: number, memberId: number, dto: UpdateMemberRoleDto): Promise<boolean>;
}