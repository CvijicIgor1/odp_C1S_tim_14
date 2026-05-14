import { UserRole } from "../../enums/UserRole";

export interface IUserAdminRepository {
    updateRole(id: number, role: UserRole): Promise<boolean>;
    updateStatus(id: number, isActive: boolean): Promise<boolean>;
    deactivate(id: number): Promise<boolean>;
}
