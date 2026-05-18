import axios from "axios";
import type { AuthResponse } from "../../types/auth/AuthResponse";
import type { IAuthAPIService } from "./IAuthAPIService";

const BASE = import.meta.env.VITE_API_URL + "auth";
function err(e: Error, fallback: string): AuthResponse {
  return {
    success: false,
    message: axios.isAxiosError(e) ? (e.response?.data as { message?: string })?.message ?? fallback : fallback,
    data: null,
  };
}

export const authApi: IAuthAPIService = {
  async login(username, password) {
    return axios.post<AuthResponse>(`${BASE}/login`, { username, password })
      .then(r => r.data).catch(e => err(e, "Login failed"));
  },
  async register(username, fullname, email, password, image) {
    return axios.post<AuthResponse>(`${BASE}/register`, { username, full_name: fullname, email, password, image })
      .then(r => r.data).catch(e => err(e, "Registration failed"));
  },
  async logout(token) {
    await axios.post(`${BASE}/logout`, {}, { headers: { Authorization: `Bearer ${token}` } });
  },
};
