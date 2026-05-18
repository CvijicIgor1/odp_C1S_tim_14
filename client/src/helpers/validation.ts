import { UserRole } from "../models/user/UserRole";

export function validateUsername(username: string): string | null {
  const value = username.trim();
  if (value.length < 3 || value.length > 40 || !/^[a-zA-Z0-9-]+$/.test(value)) {
    return "Username must be 3-40 characters and contain only letters, numbers or dashes.";
  }
  return null;
}

export function validateEmail(email: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return "Enter a valid email address.";
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must be at least 8 characters and include one uppercase letter and one number.";
  }
  return null;
}

export function validateFullName(fullName: string): string | null {
  if (fullName.trim().length < 3 || fullName.trim().length > 120) {
    return "Full name must be between 3 and 120 characters.";
  }
  return null;
}

export function validateBase64Image(image: string, fieldLabel: string): string | null {
  if (!image || !image.startsWith("data:image/")) {
    return `${fieldLabel} is required.`;
  }
  return null;
}

export function validateTeamName(name: string): string | null {
  const value = name.trim();
  if (value.length < 2 || value.length > 80) {
    return "Team name must be between 2 and 80 characters.";
  }
  return null;
}

export function validateTeamDescription(description: string): string | null {
  const value = description.trim();
  if (value.length < 3 || value.length > 1000) {
    return "Team description must be between 3 and 1000 characters.";
  }
  return null;
}

export function validateProjectName(name: string): string | null {
  const value = name.trim();
  if (value.length < 2 || value.length > 120) {
    return "Project name must be between 2 and 120 characters.";
  }
  return null;
}

export function validateProjectDescription(description: string): string | null {
  const value = description.trim();
  if (value.length < 3 || value.length > 2000) {
    return "Project description must be between 3 and 2000 characters.";
  }
  return null;
}

export function validateFutureDate(date: string, fieldLabel: string): string | null {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime()) || parsed <= new Date()) {
    return `${fieldLabel} must be a future date.`;
  }
  return null;
}

export function validateTaskTitle(title: string): string | null {
  const value = title.trim();
  if (value.length < 2 || value.length > 200) {
    return "Task title must be between 2 and 200 characters.";
  }
  return null;
}

export function validateTaskDescription(description: string): string | null {
  const value = description.trim();
  if (value.length < 3 || value.length > 2000) {
    return "Task description must be between 3 and 2000 characters.";
  }
  return null;
}

export function validateEstimatedHours(hours: number): string | null {
  if (Number.isNaN(hours) || hours < 0.5 || hours > 500) {
    return "Estimated hours must be between 0.5 and 500.";
  }
  return null;
}

export function isAdminRole(role: UserRole | undefined): boolean {
  return role === UserRole.ADMIN;
}
