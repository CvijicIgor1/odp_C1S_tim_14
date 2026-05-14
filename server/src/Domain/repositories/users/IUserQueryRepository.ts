import { User } from "../../models/User";

export interface IUserQueryRepository {
    findById(id: number): Promise<User>;
    findByUsername(username: string): Promise<User>;
    findByEmail(email: string): Promise<User>;
    findAll(): Promise<User[]>;
}
