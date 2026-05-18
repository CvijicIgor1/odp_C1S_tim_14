import axios from "axios";
import type { IUsersAPIService, ApiResponse } from "./IUsersAPIService";
import type { UserDto } from "../../models/user/UserTypes";
import { readItem } from "../../helpers/local_storage";

const BASE = import.meta.env.VITE_API_URL + "users";

const authHeader = () => {
  const token = readItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

function err<T>(e: Error, fallback: string): ApiResponse<T> {
  return {
    success: false,
    message: axios.isAxiosError(e) ? (e.response?.data as { message?: string })?.message ?? fallback : fallback,
  };
}

export const usersApi: IUsersAPIService = {
  async getAll() {
    return axios.get<ApiResponse<UserDto[]>>(`${BASE}/all`, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Failed to load users"));
  },
  async getById(id) {
    return axios.get<ApiResponse<UserDto>>(`${BASE}/${id}`)
      .then(r => r.data).catch(e => err(e, "Failed to load user"));
  },
  async updateProfile(id, username, email, avatar, newPassword) {
    return axios.patch<ApiResponse<void>>(`${BASE}/${id}/profile`, { username, email, avatar, newPassword }, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Failed to update profile"));
  },
  async updateRole(id, role) {
    return axios.put<ApiResponse<void>>(`${BASE}/${id}/role`, { role }, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Failed to update role"));
  },
  async updateStatus(id, isActive) {
    return axios.patch<ApiResponse<void>>(`${BASE}/${id}/status`, { isActive }, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Failed to update status"));
  },
  async deactivate(id) {
    return axios.patch<ApiResponse<void>>(`${BASE}/${id}/deactivate`, {}, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Failed to deactivate user"));
  },
};
