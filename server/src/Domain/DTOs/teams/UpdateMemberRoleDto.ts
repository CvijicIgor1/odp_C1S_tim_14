import { TeamMemberRole } from "../../enums/TeamMemberRole";

export class UpdateMemberRoleDto{
    public constructor(
        public role: TeamMemberRole
    ) {}
}

