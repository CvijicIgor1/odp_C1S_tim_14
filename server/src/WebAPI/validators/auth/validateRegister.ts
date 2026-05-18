import { ValidationResult } from "../../../Domain/types/ValidationResult";

export const validateRegister = (username: string, email: string, password: string, fullName: string, image: string): ValidationResult => {
  if (!username || username.trim().length < 3 || username.trim().length > 40 || !/^[a-zA-Z0-9-]+$/.test(username.trim()))
    return { valid: false, message: "Invalid username." };
  if (!fullName || fullName.trim().length < 3 || fullName.trim().length > 120)
    return { valid: false, message: "Full name is required." };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    return { valid: false, message: "Invalid email." };
  if (!password || password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password))
    return { valid: false, message: "Invalid password." };
  if (!image || !image.startsWith("data:image/"))
    return { valid: false, message: "Profile image is required." };
  return { valid: true };
};