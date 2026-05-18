import { ValidationResult } from "../../../Domain/types/ValidationResult";

export const validateLogin = (username: string, password: string): ValidationResult => {
  if (!username || username.trim().length < 3) return { valid: false, message: "Korisničko ime nije validno ili je zauzeto" };
  if (!password || password.length < 8) return { valid: false, message: "Lozinka ne ispunjava uslove" };
  return { valid: true };
};