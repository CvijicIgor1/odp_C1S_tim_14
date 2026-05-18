import { ValidationResult } from "../../../Domain/types/ValidationResult";

export const validateRegister = (username: string, email: string, password: string): ValidationResult => {
  if (!username || username.trim().length < 3 || username.length > 40 || !/^[a-zA-Z0-9-]+$/.test(username))
    return { valid: false, message: "Invalid or taken username." };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { valid: false, message: "Email already taken." };
  if (!password || password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password))
    return { valid: false, message: "Invalid password." };
  return { valid: true };
};