import axios from "axios";
import { mockAPI } from "./mockData";

// Set to true to use mock data instead of real API
const USE_MOCK_DATA = false;

const API_BASE_URL = "http://localhost:8000";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || "";
      // Do not redirect for auth endpoints (login/signup/forgot/reset)
      if (
        !requestUrl.includes("/auth/login") &&
        !requestUrl.includes("/auth/signup") &&
        !requestUrl.includes("/auth/forgot-password") &&
        !requestUrl.includes("/auth/reset-password")
      ) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  signup: (data) => api.post("/auth/signup", data),
  login: (email, password) =>
    api.post("/auth/login", { email, password }),
  getCurrentUser: () => api.get("/auth/me"),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token, newPassword) =>
    api.post("/auth/reset-password", { token, new_password: newPassword }),
};

// Invitations API
export const invitationsAPI = {
  acceptInvite: (token, password) => api.post("/invitations/accept", { token, password }),
  invite: (data) => api.post("/invitations/invite", data),
};

// Users API
export const usersAPI = {
  getAll: (skip = 0, limit = 100) =>
    USE_MOCK_DATA ? mockAPI.users.getAll() : api.get(`/users?skip=${skip}&limit=${limit}`),
  getById: (id) =>
    USE_MOCK_DATA ? mockAPI.users.getById(id) : api.get(`/users/${id}`),
  create: (data) =>
    USE_MOCK_DATA ? mockAPI.users.create(data) : api.post("/users", data),
  update: (id, data) =>
    USE_MOCK_DATA ? mockAPI.users.update(id, data) : api.put(`/users/${id}`, data),
  delete: (id) =>
    USE_MOCK_DATA ? mockAPI.users.delete(id) : api.delete(`/users/${id}`),
};

// Admin Users API
export const adminUsersAPI = {
  getAll: (skip = 0, limit = 200) =>
    api.get(`/admin/users?skip=${skip}&limit=${limit}`),
  promoteToPM: (userId) => api.post(`/admin/users/${userId}/promote-to-pm`),
  demoteToMember: (userId) => api.post(`/admin/users/${userId}/demote-to-member`),
};

// Admin Projects API
export const adminProjectsAPI = {
  create: (data) => api.post("/admin/projects", data),
};

// Projects API
export const projectsAPI = {
  getAll: (skip = 0, limit = 100, status = null) => {
    if (USE_MOCK_DATA) {
      return mockAPI.projects.getAll({ status_filter: status });
    }
    const params = new URLSearchParams({ skip, limit });
    if (status) params.append("status_filter", status);
    return api.get(`/projects?${params}`);
  },
  getById: (id) =>
    USE_MOCK_DATA ? mockAPI.projects.getById(id) : api.get(`/projects/${id}`),
  create: (data) =>
    USE_MOCK_DATA ? mockAPI.projects.create(data) : api.post("/projects", data),
  update: (id, data) =>
    USE_MOCK_DATA ? mockAPI.projects.update(id, data) : api.put(`/projects/${id}`, data),
  requestCompletion: (id) =>
    USE_MOCK_DATA ? mockAPI.projects.approve(id) : api.post(`/projects/${id}/request-completion`),
  approve: (id) =>
    USE_MOCK_DATA ? mockAPI.projects.approve(id) : api.post(`/projects/${id}/approve`),
  reject: (id) =>
    USE_MOCK_DATA ? mockAPI.projects.reject(id) : api.post(`/projects/${id}/reject`),
  delete: (id) =>
    USE_MOCK_DATA ? mockAPI.projects.delete(id) : api.delete(`/projects/${id}`),
};

// Project Members API
export const projectMembersAPI = {
  getByProject: (projectId) =>
    USE_MOCK_DATA ? mockAPI.projectMembers.getByProject(projectId) : api.get(`/project-members/project/${projectId}`),
  getByUser: (userId) =>
    USE_MOCK_DATA ? mockAPI.projectMembers.getByUser(userId) : api.get(`/project-members/user/${userId}`),
  add: (data) =>
    USE_MOCK_DATA ? mockAPI.projectMembers.add(data) : api.post("/project-members", data),
  remove: (memberId) =>
    USE_MOCK_DATA ? mockAPI.projectMembers.remove(memberId) : api.delete(`/project-members/${memberId}`),
};

// Tasks API
export const tasksAPI = {
  getAll: (params = {}) => {
    if (USE_MOCK_DATA) {
      return mockAPI.tasks.getAll(params);
    }
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        queryParams.append(key, value);
      }
    });
    return api.get(`/tasks/?${queryParams}`);
  },
  getById: (id) =>
    USE_MOCK_DATA ? mockAPI.tasks.getById(id) : api.get(`/tasks/${id}`),
  create: (data) =>
    USE_MOCK_DATA ? mockAPI.tasks.create(data) : api.post("/tasks", data),
  update: (id, data) =>
    USE_MOCK_DATA ? mockAPI.tasks.update(id, data) : api.put(`/tasks/${id}`, data),
  requestApproval: (id) =>
    USE_MOCK_DATA ? mockAPI.tasks.approve(id) : api.post(`/tasks/${id}/request-approval`),
  approve: (id) =>
    USE_MOCK_DATA ? mockAPI.tasks.approve(id) : api.post(`/tasks/${id}/approve`),
  reject: (id) =>
    USE_MOCK_DATA ? mockAPI.tasks.reject(id) : api.post(`/tasks/${id}/reject`),
  delete: (id) =>
    USE_MOCK_DATA ? mockAPI.tasks.delete(id) : api.delete(`/tasks/${id}`),
};

// Project Files API (deprecated - use filesAPI instead)
export const projectFilesAPI = {
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        queryParams.append(key, value);
      }
    });
    return api.get(`/files?${queryParams}`);
  },
  getById: (id) => api.get(`/files/${id}`),
  create: (data) => api.post("/files", data),
  delete: (id) => api.delete(`/files/${id}`),
};

// Activity Logs API
export const activityLogsAPI = {
  getAll: (params = {}) => {
    if (USE_MOCK_DATA) {
      return Promise.resolve({ data: [] });
    }
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        queryParams.append(key, value);
      }
    });
    return api.get(`/activity-logs?${queryParams}`);
  },
  getByProject: (projectId, skip = 0, limit = 100) =>
    USE_MOCK_DATA ? mockAPI.activityLogs.getByProject(projectId, skip, limit) : api.get(`/activity-logs/project/${projectId}?skip=${skip}&limit=${limit}`),
  getByTask: (taskId, skip = 0, limit = 100) =>
    USE_MOCK_DATA ? mockAPI.activityLogs.getByTask(taskId, skip, limit) : api.get(`/activity-logs/task/${taskId}?skip=${skip}&limit=${limit}`),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () =>
    USE_MOCK_DATA ? mockAPI.dashboard.getStats() : api.get("/dashboard/stats"),
  getProjectStats: (projectId) =>
    USE_MOCK_DATA ? mockAPI.dashboard.getProjectStats(projectId) : api.get(`/dashboard/project-stats/${projectId}`),
};

// Sprints API
export const sprintsAPI = {
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        queryParams.append(key, value);
      }
    });
    return api.get(`/sprints?${queryParams}`);
  },
  getById: (id) => api.get(`/sprints/${id}`),
  create: (data) => api.post("/sprints", data),
  update: (id, data) => api.put(`/sprints/${id}`, data),
  delete: (id) => api.delete(`/sprints/${id}`),
};

// Time Logs API
export const timeLogsAPI = {
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        queryParams.append(key, value);
      }
    });
    return api.get(`/time-logs?${queryParams}`);
  },
  getById: (id) => api.get(`/time-logs/${id}`),
  create: (data) => api.post("/time-logs", data),
  update: (id, data) => api.put(`/time-logs/${id}`, data),
  delete: (id) => api.delete(`/time-logs/${id}`),
};

// Approvals API
export const approvalsAPI = {
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        queryParams.append(key, value);
      }
    });
    return api.get(`/approvals?${queryParams}`);
  },
  getById: (id) => api.get(`/approvals/${id}`),
  create: (data) => api.post("/approvals", data),
  approve: (id, remarks = null) => api.post(`/approvals/${id}/approve`, { remarks }),
  reject: (id, remarks = null) => api.post(`/approvals/${id}/reject`, { remarks }),
};

// Files API (updated endpoint)
export const filesAPI = {
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        queryParams.append(key, value);
      }
    });
    return api.get(`/files?${queryParams}`);
  },
  getById: (id) => api.get(`/files/${id}`),
  create: (data) => {
    // For file uploads, we need to remove the default Content-Type header
    // so the browser can set it with the proper boundary for multipart/form-data
    return api.post("/files/upload", data, {
      headers: {
        ...api.defaults.headers,
        'Content-Type': undefined, // Let browser set this for FormData
      },
    });
  },
  delete: (id) => api.delete(`/files/${id}`),
};

export default api;

