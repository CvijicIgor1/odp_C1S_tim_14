import { ValidationResult } from "../../../Domain/types/ValidationResult";

export const validateLogin = (username: string, password: string): ValidationResult => {
  if (!username || username.trim().length < 3 || username.trim().length > 40 || !/^[a-zA-Z0-9-]+$/.test(username.trim())) {return { valid: false, message: "Invalid username." };}
  if (!password || password.length < 8) return { valid: false, message: "Invalid password." };
  return { valid: true };
};