import type { UserRole } from "./UserRole";

export type UserDto = {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  fullName: string;
  avatar: string;
  isActive: number;
  createdAt: string | null;
  updatedAt: string | null;
};
