import { CreateTeamDto } from '../../DTOs/teams/CreateTeamDto';
import { UpdateTeamDto } from '../../DTOs/teams/UpdateTeamDto';
import { Team } from "../../models/Team";
import { TeamMember } from '../../models/TeamMember';
import { AddMemberDto } from '../../DTOs/teams/AddMemberDto';
import { UpdateMemberRoleDto } from '../../DTOs/teams/UpdateMemberRoleDto';
import { TeamMemberRole } from '../../enums/TeamMemberRole';


export interface ITeamRepository {
  findAll(userId: number): Promise<{teams: Array<{team: Team; role: string}>, totalNumber: number}>;
  findAllAsAdmin(): Promise<{ teams: Team[], totalNumber: number }>;
  findById(teamId: number): Promise<Team | null>;
  create(noviTeam: Team, ownerId: number): Promise<Team>;
  update(teamId: number, inputTeam: Team): Promise<boolean>;
  delete(teamId: number): Promise<boolean>;
  getMembers(teamId: number): Promise<{members: TeamMember[], totalNumber: number}>;
  countOwners(teamId: number): Promise<number>;
  isOwner(teamId: number, userId: number): Promise<boolean>;
  addMember(teamId: number, noviClan: TeamMember): Promise<boolean>;
  removeMember(teamId: number, memberId: number): Promise<boolean>;
  updateMemberRole(teamId: number, memberId: number, novaUloga: TeamMemberRole): Promise<boolean>;
}