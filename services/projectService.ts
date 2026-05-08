import axios from "axios";
import {
  CreateProjectInput,
  UpdateProjectInput,
} from "@/app/api/projects/schema";

const API_URL = "/api/projects";

export const projectService = {
  createProject: async (data: CreateProjectInput) => {
    const response = await axios.post(API_URL, data);
    return response.data;
  },

  createDraft: async (leaderId: string) => {
    const response = await axios.post(API_URL, { draft: true, leaderId });
    return response.data as { success: boolean; data: { id: string } };
  },

  findExistingDraft: async (leaderId: string) => {
    const response = await axios.get(
      `${API_URL}?status=DRAFT&leaderId=${encodeURIComponent(leaderId)}&limit=1`,
    );
    const projects = response.data.data?.projects as
      | { id: string }[]
      | undefined;
    return projects && projects.length > 0 ? projects[0] : null;
  },

  getProject: async (id: string) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data.data; // API returns { success: true, data: project }
  },

  updateProject: async (id: string, data: UpdateProjectInput) => {
    const response = await axios.put(`${API_URL}/${id}`, data);
    return response.data.data;
  },

  transitionStatus: async (
    id: string,
    data: {
      toStatus: string;
      userId: string;
      actorRole: string;
      branchChoice?: string;
    },
  ) => {
    const response = await axios.post(`${API_URL}/${id}/status/transition`, data);
    return response.data;
  },

  getLatestProject: async () => {
    const response = await axios.get(`${API_URL}?limit=1`);
    if (response.data.data.projects && response.data.data.projects.length > 0) {
      return response.data.data.projects[0];
    }
    return null;
  },
};
