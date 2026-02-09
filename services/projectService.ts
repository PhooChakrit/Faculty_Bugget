import axios from "axios";
import { CreateProjectInput } from "@/app/api/projects/schema";

const API_URL = "/api/projects";

export const projectService = {
  createProject: async (data: CreateProjectInput) => {
    const response = await axios.post(API_URL, data);
    return response.data;
  },
};
