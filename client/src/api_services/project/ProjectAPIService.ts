import axios from "axios";
import type { IProjectAPIService, ApiResponse } from "./IProjectAPIService";
import type { ProjectDto, PaginatedList, ProjectStatus, Priority } from "../../models/project/ProjectTypes";
import { readItem } from "../../helpers/local_storage";

const BASE = import.meta.env.VITE_API_URL;

const auth = () => {
  const token = readItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const err = <T>(e: unknown, fallback: string): ApiResponse<T> => ({
  success: false,
  message: axios.isAxiosError(e) ? (e.response?.data as { message?: string })?.message ?? fallback : fallback,
});

export const projectsApi: IProjectAPIService = {
  async getTeamProjects(teamId, page = 1, limit = 20, filters = {}) {
    return axios
      .get<ApiResponse<PaginatedList<ProjectDto>>>(`${BASE}teams/${teamId}/projects`, {
        headers: auth(),
        params: { page, limit, ...filters },
      })
      .then(r => r.data)
      .catch(e => err(e, "Failed to load projects"));
  },

  async getWatched(page = 1, limit = 20) {
    return axios
      .get<ApiResponse<PaginatedList<ProjectDto>>>(`${BASE}projects/watched`, {
        headers: auth(),
        params: { page, limit },
      })
      .then(r => r.data)
      .catch(e => err(e, "Failed to load watched projects"));
  },

  async getById(id) {
    return axios
      .get<ApiResponse<ProjectDto>>(`${BASE}projects/${id}`, { headers: auth() })
      .then(r => r.data)
      .catch(e => err(e, "Failed to load project"));
  },

  async create(teamId, name, description, status, priority, deadline, tagIds = []) {
    return axios
      .post<ApiResponse<ProjectDto>>(`${BASE}teams/${teamId}/projects`, { name, description, status, priority, deadline, tagIds }, { headers: auth() })
      .then(r => r.data)
      .catch(e => err(e, "Failed to create project"));
  },

  async update(id, data) {
    return axios
      .put<ApiResponse<void>>(`${BASE}projects/${id}`, data, { headers: auth() })
      .then(r => r.data)
      .catch(e => err(e, "Failed to update project"));
  },

  async delete(id) {
    return axios
      .delete<ApiResponse<void>>(`${BASE}projects/${id}`, { headers: auth() })
      .then(r => r.data)
      .catch(e => err(e, "Failed to delete project"));
  },

  async addTag(id, tagId) {
    return axios
      .post<ApiResponse<void>>(`${BASE}projects/${id}/tags`, { tagId }, { headers: auth() })
      .then(r => r.data)
      .catch(e => err(e, "Failed to add tag"));
  },

  async removeTag(id, tagId) {
    return axios
      .delete<ApiResponse<void>>(`${BASE}projects/${id}/tags/${tagId}`, { headers: auth() })
      .then(r => r.data)
      .catch(e => err(e, "Failed to remove tag"));
  },

  async watch(id) {
    return axios
      .post<ApiResponse<void>>(`${BASE}projects/${id}/watch`, {}, { headers: auth() })
      .then(r => r.data)
      .catch(e => err(e, "Failed to watch project"));
  },

  async unwatch(id) {
    return axios
      .delete<ApiResponse<void>>(`${BASE}projects/${id}/watch`, { headers: auth() })
      .then(r => r.data)
      .catch(e => err(e, "Failed to unwatch project"));
  },
};
