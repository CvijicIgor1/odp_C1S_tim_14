import { PROJECT_NAME_MIN, PROJECT_NAME_MAX } from "../../../Domain/constants/Constants";
import { CreateProjectDto } from "../../../Domain/DTOs/projects/CreateProjectDto";
import { UpdateProjectDto } from "../../../Domain/DTOs/projects/UpdateProjectDto";
import { Priority } from "../../../Domain/enums/Priority";
import { ProjectStatus } from "../../../Domain/enums/ProjectStatus";
import { ValidationError } from "../../../Domain/types/ValidationError";

export function validateCreateProject(dto: CreateProjectDto): ValidationError | null {
    if (!dto.name || !dto.description || !dto.deadline) {
        return { message: "name, description and deadline are required" };
    }
    if (dto.name.length < PROJECT_NAME_MIN || dto.name.length > PROJECT_NAME_MAX) {
        return { message: `Project name must be between ${PROJECT_NAME_MIN} and ${PROJECT_NAME_MAX} characters` };
    }
    if (dto.description.trim().length < 3 || dto.description.trim().length > 2000) {
        return { message: "Project description must be between 3 and 2000 characters" };
    }
    if (!Object.values(ProjectStatus).includes(dto.status)) {
        return { message: "Invalid project status" };
    }
    if (!Object.values(Priority).includes(dto.priority)) {
        return { message: "Invalid project priority" };
    }
    if (Number.isNaN(new Date(dto.deadline).getTime()) || new Date(dto.deadline) <= new Date()) {
        return { message: "Deadline must be a future date" };
    }
    if (!Array.isArray(dto.tagIds) || dto.tagIds.some((tagId) => !Number.isInteger(tagId) || tagId <= 0)) {
        return { message: "tagIds must contain valid positive integers" };
    }
    return null;
}

export function validateUpdateProject(dto: UpdateProjectDto): ValidationError | null {
    if (dto.name !== undefined && (dto.name.length < PROJECT_NAME_MIN || dto.name.length > PROJECT_NAME_MAX)) {
        return { message: `Project name must be between ${PROJECT_NAME_MIN} and ${PROJECT_NAME_MAX} characters` };
    }
    if (dto.description !== undefined && (dto.description.trim().length < 3 || dto.description.trim().length > 2000)) {
        return { message: "Project description must be between 3 and 2000 characters" };
    }
    if (dto.status !== undefined && !Object.values(ProjectStatus).includes(dto.status)) {
        return { message: "Invalid project status" };
    }
    if (dto.priority !== undefined && !Object.values(Priority).includes(dto.priority)) {
        return { message: "Invalid project priority" };
    }
    if (dto.deadline && (Number.isNaN(new Date(dto.deadline).getTime()) || new Date(dto.deadline) <= new Date())) {
        return { message: "Deadline must be a future date" };
    }
    return null;
}
