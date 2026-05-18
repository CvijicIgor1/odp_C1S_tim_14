import { TEAM_NAME_MIN, TEAM_NAME_MAX } from "../../../Domain/constants/Constants";
import { CreateTeamDto } from "../../../Domain/DTOs/teams/CreateTeamDto";
import { UpdateTeamDto } from "../../../Domain/DTOs/teams/UpdateTeamDto";
import { TeamMemberRole } from "../../../Domain/enums/TeamMemberRole";
import { ValidationError } from "../../../Domain/types/ValidationError";

export function validateCreateTeam(dto: CreateTeamDto): ValidationError | null {
    if (!dto.name || !dto.description || !dto.avatar) {
        return { message: "All fields are mandatory (name, description, avatar)" };
    }
    if (dto.name.length < TEAM_NAME_MIN || dto.name.length > TEAM_NAME_MAX) {
        return { message: `Team name must be between ${TEAM_NAME_MIN} and ${TEAM_NAME_MAX} characters` };
    }
    if (dto.description.trim().length < 3 || dto.description.trim().length > 1000) {
        return { message: "Team description must be between 3 and 1000 characters" };
    }
    if (!dto.avatar.startsWith("data:image/")) {
        return { message: "Team avatar must be a base64 image" };
    }
    return null;
}

export function validateUpdateTeam(dto: UpdateTeamDto): ValidationError | null {
    if (dto.name !== undefined && (dto.name.length < TEAM_NAME_MIN || dto.name.length > TEAM_NAME_MAX)) {
        return { message: `Team name must be between ${TEAM_NAME_MIN} and ${TEAM_NAME_MAX} characters` };
    }
    if (dto.description !== undefined && (dto.description.trim().length < 3 || dto.description.trim().length > 1000)) {
        return { message: "Team description must be between 3 and 1000 characters" };
    }
    if (dto.avatar !== undefined && dto.avatar !== "" && !dto.avatar.startsWith("data:image/")) {
        return { message: "Team avatar must be a base64 image" };
    }
    return null;
}

export function validateMemberRole(role: string | undefined): ValidationError | null {
    if (!role || (role !== TeamMemberRole.OWNER && role !== TeamMemberRole.MEMBER)) {
        return { message: "Role must be 'owner' or 'member'" };
    }
    return null;
}
