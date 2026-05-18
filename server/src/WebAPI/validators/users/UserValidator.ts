import { UserRole } from "../../../Domain/enums/UserRole";
import { ValidationError } from "../../../Domain/types/ValidationError";

export function validateUpdateRole(role: string | undefined): ValidationError | null {
    if (!role || !Object.values(UserRole).includes(role as UserRole)) {
        return { message: "Valid role is required ('user' or 'admin')" };
    }
    return null;
}

export function validateUpdateStatus(isActive: unknown): ValidationError | null {
    if (isActive === undefined || typeof isActive !== "boolean") {
        return { message: "isActive (boolean) is required" };
    }
    return null;
}

export function validateUpdateProfile(body: { username?: string; email?: string }): ValidationError | null {
    if (!body.username || !body.email) {
        return { message: "username and email are required" };
    }
    if (body.username.trim().length < 3 || body.username.trim().length > 40 || !/^[a-zA-Z0-9-]+$/.test(body.username.trim())) {
        return { message: "username must be 3-40 characters and contain only letters, numbers or dashes" };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
        return { message: "valid email is required" };
    }
    return null;
}

export function validatePasswordUpdate(password: string | undefined): ValidationError | null {
    if (!password) return null;
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
        return { message: "newPassword must be at least 8 characters long and include one uppercase letter and one number" };
    }
    return null;
}
