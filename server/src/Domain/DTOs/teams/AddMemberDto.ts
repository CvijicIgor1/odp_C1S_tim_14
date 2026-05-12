import { TeamMemberRole } from "../../enums/TeamMemberRole";

export class AddMemberDto {
    public constructor(
        public username: string,
        public role: TeamMemberRole = TeamMemberRole.MEMBER
    ) {}
}

//mora DTO za ovo jer u rutama pise da se username ne prenosi preko url-a