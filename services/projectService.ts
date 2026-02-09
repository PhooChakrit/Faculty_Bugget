import axios from "axios";
import { CreateProjectInput } from "@/app/api/projects/schema";

const API_URL = "/api/projects";

export const projectService = {
  createProject: async (data: CreateProjectInput) => {
    const response = await axios.post(API_URL, data);
    return response.data;
  },

  getProject: async (id: string) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data.data; // API returns { success: true, data: project }
  },

  updateProject: async (id: string, data: Partial<CreateProjectInput>) => {
    const response = await axios.put(`${API_URL}/${id}`, data);
    return response.data.data;
  },

  getLatestProject: async () => {
    const response = await axios.get(`${API_URL}?limit=1`);
    if (response.data.data.projects && response.data.data.projects.length > 0) {
      return response.data.data.projects[0];
    }
    return null;
  },
};
