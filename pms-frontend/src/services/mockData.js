// Mock data for demonstration purposes

export const mockUsers = [
  {
    id: 1,
    name: "Admin User",
    email: "admin@saphul.com",
    role: "ADMIN",
    status: "ACTIVE",
    created_at: "2024-01-01T00:00:00",
    updated_at: "2024-01-01T00:00:00",
  },
  {
    id: 2,
    name: "John Manager",
    email: "john@example.com",
    role: "PROJECT_MANAGER",
    status: "ACTIVE",
    created_at: "2024-01-02T00:00:00",
    updated_at: "2024-01-02T00:00:00",
  },
  {
    id: 3,
    name: "Sarah Developer",
    email: "sarah@example.com",
    role: "MEMBER",
    status: "ACTIVE",
    created_at: "2024-01-03T00:00:00",
    updated_at: "2024-01-03T00:00:00",
  },
  {
    id: 4,
    name: "Mike Designer",
    email: "mike@example.com",
    role: "MEMBER",
    status: "ACTIVE",
    created_at: "2024-01-04T00:00:00",
    updated_at: "2024-01-04T00:00:00",
  },
];

export const mockProjects = [
  {
    id: 1,
    name: "Website Redesign",
    description: "Complete redesign of the company website with modern UI/UX",
    status: "IN_PROGRESS",
    review_status: "PENDING",
    created_by: 1,
    created_at: "2024-01-10T00:00:00",
    updated_at: "2024-01-15T00:00:00",
    start_date: "2024-01-10T00:00:00",
    end_date: "2024-02-28T00:00:00",
  },
  {
    id: 2,
    name: "Mobile App Development",
    description: "Develop a cross-platform mobile application for iOS and Android",
    status: "PENDING",
    review_status: "PENDING",
    created_by: 1,
    created_at: "2024-01-12T00:00:00",
    updated_at: "2024-01-12T00:00:00",
    start_date: null,
    end_date: null,
  },
  {
    id: 3,
    name: "API Integration",
    description: "Integrate third-party APIs for payment processing",
    status: "COMPLETED",
    review_status: "APPROVED",
    created_by: 1,
    created_at: "2023-12-01T00:00:00",
    updated_at: "2023-12-20T00:00:00",
    start_date: "2023-12-01T00:00:00",
    end_date: "2023-12-20T00:00:00",
  },
  {
    id: 4,
    name: "Database Migration",
    description: "Migrate legacy database to new PostgreSQL schema",
    status: "IN_PROGRESS",
    review_status: "PENDING",
    created_by: 1,
    created_at: "2024-01-05T00:00:00",
    updated_at: "2024-01-18T00:00:00",
    start_date: "2024-01-05T00:00:00",
    end_date: "2024-02-15T00:00:00",
  },
];

export const mockTasks = [
  {
    id: 1,
    title: "Design Homepage Layout",
    description: "Create wireframes and mockups for the new homepage",
    status: "IN_PROGRESS",
    review_status: "PENDING",
    progress: 65.5,
    project_id: 1,
    assigned_to: 4,
    created_at: "2024-01-10T00:00:00",
    updated_at: "2024-01-18T00:00:00",
    due_date: "2024-01-25T00:00:00",
    completed_at: null,
  },
  {
    id: 2,
    title: "Implement User Authentication",
    description: "Set up JWT-based authentication system",
    status: "COMPLETED",
    review_status: "APPROVED",
    progress: 100.0,
    project_id: 1,
    assigned_to: 3,
    created_at: "2024-01-11T00:00:00",
    updated_at: "2024-01-16T00:00:00",
    due_date: "2024-01-20T00:00:00",
    completed_at: "2024-01-16T00:00:00",
  },
  {
    id: 3,
    title: "Setup Development Environment",
    description: "Configure React Native development environment",
    status: "PENDING",
    review_status: "PENDING",
    progress: 0.0,
    project_id: 2,
    assigned_to: 3,
    created_at: "2024-01-12T00:00:00",
    updated_at: "2024-01-12T00:00:00",
    due_date: "2024-01-30T00:00:00",
    completed_at: null,
  },
  {
    id: 4,
    title: "Payment Gateway Integration",
    description: "Integrate Stripe payment gateway",
    status: "COMPLETED",
    review_status: "APPROVED",
    progress: 100.0,
    project_id: 3,
    assigned_to: 3,
    created_at: "2023-12-05T00:00:00",
    updated_at: "2023-12-18T00:00:00",
    due_date: "2023-12-20T00:00:00",
    completed_at: "2023-12-18T00:00:00",
  },
  {
    id: 5,
    title: "Create Database Schema",
    description: "Design and implement new database schema",
    status: "IN_PROGRESS",
    review_status: "PENDING",
    progress: 45.0,
    project_id: 4,
    assigned_to: 3,
    created_at: "2024-01-05T00:00:00",
    updated_at: "2024-01-17T00:00:00",
    due_date: "2024-01-30T00:00:00",
    completed_at: null,
  },
  {
    id: 6,
    title: "Migrate User Data",
    description: "Transfer existing user data to new schema",
    status: "PENDING",
    review_status: "PENDING",
    progress: 0.0,
    project_id: 4,
    assigned_to: 3,
    created_at: "2024-01-06T00:00:00",
    updated_at: "2024-01-06T00:00:00",
    due_date: "2024-02-10T00:00:00",
    completed_at: null,
  },
];

export const mockProjectMembers = [
  { id: 1, project_id: 1, user_id: 2, created_at: "2024-01-10T00:00:00", updated_at: "2024-01-10T00:00:00" },
  { id: 2, project_id: 1, user_id: 3, created_at: "2024-01-10T00:00:00", updated_at: "2024-01-10T00:00:00" },
  { id: 3, project_id: 1, user_id: 4, created_at: "2024-01-10T00:00:00", updated_at: "2024-01-10T00:00:00" },
  { id: 4, project_id: 2, user_id: 2, created_at: "2024-01-12T00:00:00", updated_at: "2024-01-12T00:00:00" },
  { id: 5, project_id: 2, user_id: 3, created_at: "2024-01-12T00:00:00", updated_at: "2024-01-12T00:00:00" },
  { id: 6, project_id: 4, user_id: 2, created_at: "2024-01-05T00:00:00", updated_at: "2024-01-05T00:00:00" },
  { id: 7, project_id: 4, user_id: 3, created_at: "2024-01-05T00:00:00", updated_at: "2024-01-05T00:00:00" },
];

export const mockActivityLogs = [
  {
    id: 1,
    activity_type: "PROJECT_CREATED",
    description: "Project 'Website Redesign' created",
    user_id: 1,
    project_id: 1,
    task_id: null,
    created_at: "2024-01-10T00:00:00",
  },
  {
    id: 2,
    activity_type: "TASK_CREATED",
    description: "Task 'Design Homepage Layout' created",
    user_id: 2,
    project_id: 1,
    task_id: 1,
    created_at: "2024-01-10T00:00:00",
  },
  {
    id: 3,
    activity_type: "TASK_STATUS_CHANGED",
    description: "Task status changed to IN_PROGRESS",
    user_id: 4,
    project_id: 1,
    task_id: 1,
    created_at: "2024-01-12T00:00:00",
  },
  {
    id: 4,
    activity_type: "TASK_PROGRESS_UPDATED",
    description: "Task progress updated to 65%",
    user_id: 4,
    project_id: 1,
    task_id: 1,
    created_at: "2024-01-15T00:00:00",
  },
  {
    id: 5,
    activity_type: "TASK_COMPLETED",
    description: "Task 'Implement User Authentication' completed",
    user_id: 3,
    project_id: 1,
    task_id: 2,
    created_at: "2024-01-16T00:00:00",
  },
];

export const mockProjectStats = {
  1: {
    id: 1,
    project_id: 1,
    total_tasks: 2,
    pending_tasks: 0,
    in_progress_tasks: 1,
    completed_tasks: 1,
    average_progress: 82.75,
    created_at: "2024-01-10T00:00:00",
    updated_at: "2024-01-18T00:00:00",
  },
  2: {
    id: 2,
    project_id: 2,
    total_tasks: 1,
    pending_tasks: 1,
    in_progress_tasks: 0,
    completed_tasks: 0,
    average_progress: 0.0,
    created_at: "2024-01-12T00:00:00",
    updated_at: "2024-01-12T00:00:00",
  },
  3: {
    id: 3,
    project_id: 3,
    total_tasks: 1,
    pending_tasks: 0,
    in_progress_tasks: 0,
    completed_tasks: 1,
    average_progress: 100.0,
    created_at: "2023-12-01T00:00:00",
    updated_at: "2023-12-20T00:00:00",
  },
  4: {
    id: 4,
    project_id: 4,
    total_tasks: 2,
    pending_tasks: 1,
    in_progress_tasks: 1,
    completed_tasks: 0,
    average_progress: 22.5,
    created_at: "2024-01-05T00:00:00",
    updated_at: "2024-01-17T00:00:00",
  },
};

// Helper function to simulate API delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock API functions
export const mockAPI = {
  users: {
    getAll: async () => {
      await delay(300);
      return { data: mockUsers };
    },
    getById: async (id) => {
      await delay(200);
      const user = mockUsers.find((u) => u.id === id);
      return { data: user };
    },
    create: async (data) => {
      await delay(400);
      const newUser = {
        ...data,
        id: mockUsers.length + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockUsers.push(newUser);
      return { data: newUser };
    },
    update: async (id, data) => {
      await delay(300);
      const index = mockUsers.findIndex((u) => u.id === id);
      if (index !== -1) {
        mockUsers[index] = { ...mockUsers[index], ...data, updated_at: new Date().toISOString() };
        return { data: mockUsers[index] };
      }
      throw new Error("User not found");
    },
    delete: async (id) => {
      await delay(300);
      const index = mockUsers.findIndex((u) => u.id === id);
      if (index !== -1) {
        mockUsers[index].is_deleted = true;
        mockUsers[index].deleted_at = new Date().toISOString();
      }
      return { data: {} };
    },
  },

  projects: {
    getAll: async (params = {}) => {
      await delay(400);
      let filtered = [...mockProjects];
      if (params.status_filter) {
        filtered = filtered.filter((p) => p.status === params.status_filter);
      }
      return { data: filtered };
    },
    getById: async (id) => {
      await delay(200);
      const project = mockProjects.find((p) => p.id === id);
      return { data: project };
    },
    create: async (data) => {
      await delay(400);
      const newProject = {
        ...data,
        id: mockProjects.length + 1,
        created_by: 1,
        review_status: "PENDING",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockProjects.push(newProject);
      return { data: newProject };
    },
    update: async (id, data) => {
      await delay(300);
      const index = mockProjects.findIndex((p) => p.id === id);
      if (index !== -1) {
        mockProjects[index] = { ...mockProjects[index], ...data, updated_at: new Date().toISOString() };
        return { data: mockProjects[index] };
      }
      throw new Error("Project not found");
    },
    approve: async (id) => {
      await delay(300);
      const project = mockProjects.find((p) => p.id === id);
      if (project) {
        project.review_status = "APPROVED";
        project.updated_at = new Date().toISOString();
        return { data: project };
      }
      throw new Error("Project not found");
    },
    reject: async (id) => {
      await delay(300);
      const project = mockProjects.find((p) => p.id === id);
      if (project) {
        project.review_status = "REJECTED";
        project.updated_at = new Date().toISOString();
        return { data: project };
      }
      throw new Error("Project not found");
    },
    delete: async (id) => {
      await delay(300);
      const index = mockProjects.findIndex((p) => p.id === id);
      if (index !== -1) {
        mockProjects[index].is_deleted = true;
        mockProjects[index].deleted_at = new Date().toISOString();
      }
      return { data: {} };
    },
  },

  tasks: {
    getAll: async (params = {}) => {
      await delay(400);
      let filtered = [...mockTasks];
      if (params.project_id) {
        filtered = filtered.filter((t) => t.project_id === parseInt(params.project_id));
      }
      if (params.assigned_to) {
        filtered = filtered.filter((t) => t.assigned_to === parseInt(params.assigned_to));
      }
      if (params.status_filter) {
        filtered = filtered.filter((t) => t.status === params.status_filter);
      }
      return { data: filtered };
    },
    getById: async (id) => {
      await delay(200);
      const task = mockTasks.find((t) => t.id === id);
      return { data: task };
    },
    create: async (data) => {
      await delay(400);
      const newTask = {
        ...data,
        id: mockTasks.length + 1,
        status: "PENDING",
        review_status: "PENDING",
        progress: 0.0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: null,
      };
      mockTasks.push(newTask);
      return { data: newTask };
    },
    update: async (id, data) => {
      await delay(300);
      const index = mockTasks.findIndex((t) => t.id === id);
      if (index !== -1) {
        mockTasks[index] = { ...mockTasks[index], ...data, updated_at: new Date().toISOString() };
        if (data.status === "COMPLETED" && !mockTasks[index].completed_at) {
          mockTasks[index].completed_at = new Date().toISOString();
        }
        return { data: mockTasks[index] };
      }
      throw new Error("Task not found");
    },
    approve: async (id) => {
      await delay(300);
      const task = mockTasks.find((t) => t.id === id);
      if (task) {
        task.review_status = "APPROVED";
        task.updated_at = new Date().toISOString();
        return { data: task };
      }
      throw new Error("Task not found");
    },
    reject: async (id) => {
      await delay(300);
      const task = mockTasks.find((t) => t.id === id);
      if (task) {
        task.review_status = "REJECTED";
        task.updated_at = new Date().toISOString();
        return { data: task };
      }
      throw new Error("Task not found");
    },
    delete: async (id) => {
      await delay(300);
      const index = mockTasks.findIndex((t) => t.id === id);
      if (index !== -1) {
        mockTasks[index].is_deleted = true;
        mockTasks[index].deleted_at = new Date().toISOString();
      }
      return { data: {} };
    },
  },

  projectMembers: {
    getByProject: async (projectId) => {
      await delay(300);
      const members = mockProjectMembers.filter((m) => m.project_id === projectId);
      return { data: members };
    },
    add: async (data) => {
      await delay(400);
      const newMember = {
        ...data,
        id: mockProjectMembers.length + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockProjectMembers.push(newMember);
      return { data: newMember };
    },
    remove: async (memberId) => {
      await delay(300);
      const index = mockProjectMembers.findIndex((m) => m.id === memberId);
      if (index !== -1) {
        mockProjectMembers[index].is_deleted = true;
        mockProjectMembers[index].deleted_at = new Date().toISOString();
      }
      return { data: {} };
    },
  },

  activityLogs: {
    getByProject: async (projectId, skip = 0, limit = 100) => {
      await delay(300);
      const logs = mockActivityLogs.filter((l) => l.project_id === projectId);
      return { data: logs.slice(skip, skip + limit) };
    },
    getByTask: async (taskId, skip = 0, limit = 100) => {
      await delay(300);
      const logs = mockActivityLogs.filter((l) => l.task_id === taskId);
      return { data: logs.slice(skip, skip + limit) };
    },
  },

  dashboard: {
    getStats: async () => {
      await delay(400);
      return {
        data: {
          projects: {
            total: mockProjects.length,
            pending: mockProjects.filter((p) => p.status === "PENDING").length,
            in_progress: mockProjects.filter((p) => p.status === "IN_PROGRESS").length,
            completed: mockProjects.filter((p) => p.status === "COMPLETED").length,
          },
          tasks: {
            total: mockTasks.length,
            pending: mockTasks.filter((t) => t.status === "PENDING").length,
            in_progress: mockTasks.filter((t) => t.status === "IN_PROGRESS").length,
            completed: mockTasks.filter((t) => t.status === "COMPLETED").length,
          },
          users: {
            total: mockUsers.length,
          },
        },
      };
    },
    getProjectStats: async (projectId) => {
      await delay(300);
      return { data: mockProjectStats[projectId] || mockProjectStats[1] };
    },
  },
};



