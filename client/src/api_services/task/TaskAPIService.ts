import axios from "axios";
import type { ITaskAPIService } from "./ITaskAPIService";
import type { ApiResponse } from "../team/ITeamAPIService";
import type { TaskDto, TaskDetailDto, GroupedTasksDto, CommentDto, TaskStatus, Priority } from "../../models/project/ProjectTypes";
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

export const tasksApi: ITaskAPIService = {
  async getByProject(projectId) {
    return axios
      .get<ApiResponse<GroupedTasksDto>>(`${BASE}projects/${projectId}/tasks`, { headers: auth() })
      .then(r => r.data)
      .catch(e => err(e, "Failed to load tasks"));
  },

  async getById(id) {
    return axios
      .get<ApiResponse<TaskDetailDto>>(`${BASE}tasks/${id}`, { headers: auth() })
      .then(r => r.data)
      .catch(e => err(e, "Failed to load task"));
  },

  async create(projectId, title, description, status, priority, deadline, estimatedHours = 0) {
    return axios
      .post<ApiResponse<TaskDto>>(`${BASE}projects/${projectId}/tasks`, { title, description, status, priority, deadline, estimatedHours }, { headers: auth() })
      .then(r => r.data)
      .catch(e => err(e, "Failed to create task"));
  },

  async update(id, data) {
    return axios
      .put<ApiResponse<void>>(`${BASE}tasks/${id}`, data, { headers: auth() })
      .then(r => r.data)
      .catch(e => err(e, "Failed to update task"));
  },

  async updateStatus(id, status) {
    return axios
      .patch<ApiResponse<void>>(`${BASE}tasks/${id}/status`, { status }, { headers: auth() })
      .then(r => r.data)
      .catch(e => err(e, "Failed to update task status"));
  },

  async delete(id) {
    return axios
      .delete<ApiResponse<void>>(`${BASE}tasks/${id}`, { headers: auth() })
      .then(r => r.data)
      .catch(e => err(e, "Failed to delete task"));
  },

  async addAssignee(taskId, userId) {
    return axios
      .post<ApiResponse<void>>(`${BASE}tasks/${taskId}/assignees`, { userId }, { headers: auth() })
      .then(r => r.data)
      .catch(e => err(e, "Failed to add assignee"));
  },

  async removeAssignee(taskId, userId) {
    return axios
      .delete<ApiResponse<void>>(`${BASE}tasks/${taskId}/assignees/${userId}`, { headers: auth() })
      .then(r => r.data)
      .catch(e => err(e, "Failed to remove assignee"));
  },

  async addComment(taskId, content) {
    return axios
      .post<ApiResponse<CommentDto>>(`${BASE}tasks/${taskId}/comments`, { content }, { headers: auth() })
      .then(r => r.data)
      .catch(e => err(e, "Failed to add comment"));
  },

  async deleteComment(taskId, commentId) {
    return axios
      .delete<ApiResponse<void>>(`${BASE}tasks/${taskId}/comments/${commentId}`, { headers: auth() })
      .then(r => r.data)
      .catch(e => err(e, "Failed to delete comment"));
  },
};
