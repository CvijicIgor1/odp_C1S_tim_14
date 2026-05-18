import { PROJECT_NAME_MIN, PROJECT_NAME_MAX } from "../../../Domain/constants/Constants";
import { CreateProjectDto } from "../../../Domain/DTOs/projects/CreateProjectDto";
import { UpdateProjectDto } from "../../../Domain/DTOs/projects/UpdateProjectDto";
import { ValidationError } from "../../../Domain/types/ValidationError";

export function validateCreateProject(dto: CreateProjectDto): ValidationError | null {
    if (!dto.name || !dto.description || !dto.deadline) {
        return { message: "name, description and deadline are required" };
    }
    if (dto.name.length < PROJECT_NAME_MIN || dto.name.length > PROJECT_NAME_MAX) {
        return { message: `Project name must be between ${PROJECT_NAME_MIN} and ${PROJECT_NAME_MAX} characters` };
    }
    if (new Date(dto.deadline) <= new Date()) {
        return { message: "Deadline must be a future date" };
    }
    return null;
}

export function validateUpdateProject(dto: UpdateProjectDto): ValidationError | null {
    if (dto.name !== undefined && (dto.name.length < PROJECT_NAME_MIN || dto.name.length > PROJECT_NAME_MAX)) {
        return { message: `Project name must be between ${PROJECT_NAME_MIN} and ${PROJECT_NAME_MAX} characters` };
    }
    if (dto.deadline && new Date(dto.deadline) <= new Date()) {
        return { message: "Deadline must be a future date" };
    }
    return null;
}
