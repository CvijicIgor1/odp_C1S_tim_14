import type { AuthResponse } from "../../types/auth/AuthResponse";

export interface IAuthAPIService {
  login(username: string, password: string): Promise<AuthResponse>;
  register(username: string, fullname: string, email: string, password: string, image: string): Promise<AuthResponse>;
  logout(token: string): Promise<void>;
}
