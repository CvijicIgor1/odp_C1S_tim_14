import { ValidationResult } from "../../../Domain/types/ValidationResult";

export const validateLogin = (username: string, password: string): ValidationResult => {
  if (!username || username.trim().length < 3) return { valid: false, message: "Invalid or taken username." };
  if (!password || password.length < 8) return { valid: false, message: "Invalid password" };
  return { valid: true };
};