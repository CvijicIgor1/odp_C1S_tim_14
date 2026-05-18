import { ValidationResult } from "../../../Domain/types/ValidationResult";

export const validateRegister = (username: string, email: string, password: string): ValidationResult => {
  if (!username || username.trim().length < 3 || username.length > 40 || !/^[a-zA-Z0-9-]+$/.test(username))
    return { valid: false, message: "Korisničko ime nije validno ili je zauzeto" };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { valid: false, message: "Email je već zauzet" };
  if (!password || password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password))
    return { valid: false, message: "Lozinka ne ispunjava uslove" };
  return { valid: true };
};