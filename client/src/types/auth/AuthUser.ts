import type { UserRole } from "../../models/user/UserRole";

export type AuthUser = { id: number; username: string; role: UserRole; avatar: string; };
