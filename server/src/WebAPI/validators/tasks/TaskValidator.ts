import {
    TASK_TITLE_MIN,
    TASK_TITLE_MAX,
    ESTIMATED_HOURS_MIN,
    ESTIMATED_HOURS_MAX,
    COMMENT_MAX_LENGTH,
} from "../../../Domain/constants/Constants";
import { Priority } from "../../../Domain/enums/Priority";
import { TaskStatus } from "../../../Domain/enums/TaskStatus";
import { UpdateTaskDto } from "../../../Domain/DTOs/tasks/UpdateTaskDto";
import { UpdateTaskStatusDto } from "../../../Domain/DTOs/tasks/UpdateTaskStatusDto";
import { ValidationError } from "../../../Domain/types/ValidationError";

export function validateEstimatedHours(hours: number): ValidationError | null {
    if (isNaN(hours) || hours < ESTIMATED_HOURS_MIN || hours > ESTIMATED_HOURS_MAX) {
        return { message: `estimated_hours must be between ${ESTIMATED_HOURS_MIN} and ${ESTIMATED_HOURS_MAX}` };
    }
    return null;
}

export function validateCreateTask(body: {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    deadline?: string;
    estimatedHours?: number | string;
}): ValidationError | null {
    if (!body.title || !body.description || !body.deadline) {
        return { message: "title, description and deadline are required" };
    }
    if (body.title.trim().length < TASK_TITLE_MIN || body.title.trim().length > TASK_TITLE_MAX) {
        return { message: `Task title must be between ${TASK_TITLE_MIN} and ${TASK_TITLE_MAX} characters` };
    }
    if (body.description.trim().length < 3 || body.description.trim().length > 2000) {
        return { message: "Task description must be between 3 and 2000 characters" };
    }
    if (!body.status || !Object.values(TaskStatus).includes(body.status as TaskStatus)) {
        return { message: "Invalid task status" };
    }
    if (!body.priority || !Object.values(Priority).includes(body.priority as Priority)) {
        return { message: "Invalid task priority" };
    }
    if (Number.isNaN(new Date(body.deadline).getTime())) {
        return { message: "Task deadline must be a valid date" };
    }
    return validateEstimatedHours(Number(body.estimatedHours ?? 0));
}

export function validateUpdateTask(dto: UpdateTaskDto): ValidationError | null {
    if (dto.title !== undefined && (dto.title.length < TASK_TITLE_MIN || dto.title.length > TASK_TITLE_MAX)) {
        return { message: `Task title must be between ${TASK_TITLE_MIN} and ${TASK_TITLE_MAX} characters` };
    }
    if (dto.description !== undefined && (dto.description.trim().length < 3 || dto.description.trim().length > 2000)) {
        return { message: "Task description must be between 3 and 2000 characters" };
    }
    if (dto.priority !== undefined && !Object.values(Priority).includes(dto.priority)) {
        return { message: "Invalid task priority" };
    }
    if (dto.deadline !== undefined && Number.isNaN(new Date(dto.deadline).getTime())) {
        return { message: "Task deadline must be a valid date" };
    }
    if (dto.estimatedHours !== undefined) {
        return validateEstimatedHours(Number(dto.estimatedHours));
    }
    return null;
}

export function validateUpdateTaskStatus(dto: UpdateTaskStatusDto): ValidationError | null {
    if (!dto.status || !Object.values(TaskStatus).includes(dto.status)) {
        return { message: "Invalid task status" };
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
