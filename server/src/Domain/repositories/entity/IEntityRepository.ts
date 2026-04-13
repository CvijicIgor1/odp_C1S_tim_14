import { UserDto } from "../../DTOs/users/UserDto";
import { CreateUserDto } from "../../DTOs/entity/CreateUserDto";    

export interface IEntityRepository {
  findById(id: number): Promise<UserDto | null>;
  findByEmail(email: string): Promise<UserDto | null>;
  findAll(): Promise<UserDto[]>;
  create(dto: CreateUserDto): Promise<number>; // vraća id
  update(id: number, fields: Partial<UserDto>): Promise<boolean>;
  delete(id: number): Promise<boolean>;
}