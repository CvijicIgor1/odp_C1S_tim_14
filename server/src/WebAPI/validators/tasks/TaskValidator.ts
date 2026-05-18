import {
    TASK_TITLE_MIN,
    TASK_TITLE_MAX,
    ESTIMATED_HOURS_MIN,
    ESTIMATED_HOURS_MAX,
    COMMENT_MAX_LENGTH,
} from "../../../Domain/constants/Constants";
import { UpdateTaskDto } from "../../../Domain/DTOs/tasks/UpdateTaskDto";

export type ValidationError = { message: string };

export function validateEstimatedHours(hours: number): ValidationError | null {
    if (isNaN(hours) || hours < ESTIMATED_HOURS_MIN || hours > ESTIMATED_HOURS_MAX) {
        return { message: `estimated_hours must be between ${ESTIMATED_HOURS_MIN} and ${ESTIMATED_HOURS_MAX}` };
    }
    return null;
}

export function validateCreateTask(body: {
    title?: string;
    description?: string;
    deadline?: string;
    estimatedHours?: unknown;
}): ValidationError | null {
    if (!body.title || !body.description || !body.deadline) {
        return { message: "title, description and deadline are required" };
    }
    return validateEstimatedHours(Number(body.estimatedHours ?? 0));
}

export function validateUpdateTask(dto: UpdateTaskDto): ValidationError | null {
    if (dto.title !== undefined && (dto.title.length < TASK_TITLE_MIN || dto.title.length > TASK_TITLE_MAX)) {
        return { message: `Task title must be between ${TASK_TITLE_MIN} and ${TASK_TITLE_MAX} characters` };
    }
    if (dto.estimatedHours !== undefined) {
        return validateEstimatedHours(Number(dto.estimatedHours));
    }
    return null;
}

export function validateComment(content: string | undefined): ValidationError | null {
    if (!content || content.trim().length === 0) {
        return { message: "content is required" };
    }
    if (content.length > COMMENT_MAX_LENGTH) {
        return { message: `Comment cannot exceed ${COMMENT_MAX_LENGTH} characters` };
    }
    return null;
}
