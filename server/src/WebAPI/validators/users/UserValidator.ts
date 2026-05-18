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
    return null;
}
