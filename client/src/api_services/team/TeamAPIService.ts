import axios from "axios";
import type { ITeamAPIService, ApiResponse } from "./ITeamAPIService";
import type { TeamDto, PaginatedList } from "../../models/team/TeamTypes";
import { readItem } from "../../helpers/local_storage";

const BASE = import.meta.env.VITE_API_URL + "teams";

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

export const teamsApi: ITeamAPIService = {
  async getAll(page = 1, limit = 20) {
    return axios.get<ApiResponse<PaginatedList<TeamDto>>>(BASE, { headers: authHeader(), params: { page, limit } })
      .then(r => r.data).catch(e => err(e, "Failed to load teams"));
  },
  async getAllAsAdmin(page = 1, limit = 100) {
    return axios.get<ApiResponse<PaginatedList<TeamDto>>>(`${BASE}/all`, { headers: authHeader(), params: { page, limit } })
      .then(r => r.data).catch(e => err(e, "Failed to load all teams"));
  },
  async getById(id) {
    return axios.get<ApiResponse<TeamDto>>(`${BASE}/${id}`, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Failed to load team"));
  },
  async create(name, description, avatar) {
    return axios.post<ApiResponse<TeamDto>>(BASE, { name, description, avatar }, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Failed to create team"));
  },
  async update(id, name, description, avatar) {
    return axios.put<ApiResponse<void>>(`${BASE}/${id}`, { name, description, avatar }, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Failed to update team"));
  },
  async delete(id) {
    return axios.delete<ApiResponse<void>>(`${BASE}/${id}`, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Failed to delete team"));
  },
  async addMember(teamId, username, role = "member") {
    return axios.post<ApiResponse<void>>(`${BASE}/${teamId}/members`, { username, role }, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Failed to add member"));
  },
  async updateMemberRole(teamId, userId, role) {
    return axios.patch<ApiResponse<void>>(`${BASE}/${teamId}/members/${userId}/role`, { role }, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Failed to update role"));
  },
  async getMembers(teamId) {
    return axios.get(`${BASE}/${teamId}/members`, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Failed to load members"));
  },
  async removeMember(teamId, userId) {
    return axios.delete<ApiResponse<void>>(`${BASE}/${teamId}/members/${userId}`, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Failed to remove member"));
  },
};
