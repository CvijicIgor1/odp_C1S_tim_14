import { TeamMemberRole } from "../enums/TeamMemberRole";

export class TeamMember {
  public constructor(
    public teamId: number = 0,
    public userId: number = 0,
    public role:  TeamMemberRole = TeamMemberRole.MEMBER,
    public joinedAt: Date = new Date()
  ) {}
}