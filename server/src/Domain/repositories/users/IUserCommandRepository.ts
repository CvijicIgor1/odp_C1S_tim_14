import { User } from "../../models/User";

export interface IUserCommandRepository {
    create(user: User): Promise<User>;
    update(user: User): Promise<boolean>;
    updateProfile(id: number, username: string, email: string, avatar: string, passwordHash?: string): Promise<boolean>;
    exists(id: number): Promise<boolean>;
}
