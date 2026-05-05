import axios from "axios";
import type { ITagAPIService } from "./ITagAPIService";
import type { ApiResponse } from "../team/ITeamAPIService";
import type { TagDto, PaginatedList } from "../../models/project/ProjectTypes";
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

export const tagsApi: ITagAPIService = {
  async getAll(page = 1, limit = 20) {
    return axios
      .get<ApiResponse<PaginatedList<TagDto>>>(`${BASE}tags`, { headers: auth(), params: { page, limit } })
      .then(r => r.data)
      .catch(e => err(e, "Failed to load tags"));
  },

  async create(name) {
    return axios
      .post<ApiResponse<TagDto>>(`${BASE}tags`, { name }, { headers: auth() })
      .then(r => r.data)
      .catch(e => err(e, "Failed to create tag"));
  },

  async delete(id) {
    return axios
      .delete<ApiResponse<void>>(`${BASE}tags/${id}`, { headers: auth() })
      .then(r => r.data)
      .catch(e => err(e, "Failed to delete tag"));
  },
};
