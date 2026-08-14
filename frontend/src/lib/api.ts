export interface User {
  id: string;
  email?: string;
  name: string;
  isGuest: boolean;
  themePreference: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string; // "To Do", "Doing", "Completed", "On Hold"
  priority?: string;
  category?: string;
  assigneeName?: string;
  tags?: string;
  dueDate?: string;
  projectId?: string;
  createdAt?: string;
  updatedAt?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Token and User session storage
export const getStoredToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('pyramid_token');
};

export const setStoredToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('pyramid_token', token);
  }
};

export const clearStoredToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('pyramid_token');
    localStorage.removeItem('pyramid_user');
  }
};

export const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem('pyramid_user');
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

export const setStoredUser = (user: User) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('pyramid_user', JSON.stringify(user));
  }
};

// API Calls
export async function apiGuestLogin(): Promise<{ user: User; token: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed guest authentication');
    const data = await res.json();
    setStoredToken(data.token);
    setStoredUser(data.user);
    return data;
  } catch (error) {
    const fallbackUser: User = {
      id: `guest-${Date.now()}`,
      name: 'Dexter',
      isGuest: true,
      themePreference: 'system',
    };
    const mockToken = `mock-token-${Date.now()}`;
    setStoredToken(mockToken);
    setStoredUser(fallbackUser);
    return { user: fallbackUser, token: mockToken };
  }
}

export async function apiGoogleLogin(email?: string, name?: string): Promise<{ user: User; token: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name }),
    });
    if (!res.ok) throw new Error('Google auth failed');
    const data = await res.json();
    setStoredToken(data.token);
    setStoredUser(data.user);
    return data;
  } catch (error) {
    const fallbackUser: User = {
      id: `google-user-${Date.now()}`,
      email: email || 'dexter@pyramid.app',
      name: name || 'Dexter',
      isGuest: false,
      themePreference: 'system',
    };
    const mockToken = `mock-google-token-${Date.now()}`;
    setStoredToken(mockToken);
    setStoredUser(fallbackUser);
    return { user: fallbackUser, token: mockToken };
  }
}

export async function apiFetchTasks(params?: {
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
}): Promise<Task[]> {
  const token = getStoredToken();
  if (!token) return [];

  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.priority) query.append('priority', params.priority);
  if (params?.category) query.append('category', params.category);
  if (params?.search) query.append('search', params.search);

  try {
    const res = await fetch(`${API_BASE_URL}/tasks?${query.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return await res.json();
  } catch (error) {
    let local = getLocalTasks();
    if (params?.status && params.status !== 'ALL') {
      local = local.filter(t => t.status === params.status);
    }
    if (params?.priority && params.priority !== 'ALL') {
      local = local.filter(t => (t.priority || 'MEDIUM') === params.priority);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      local = local.filter(t => t.title.toLowerCase().includes(q));
    }
    return local;
  }
}

export async function apiGetTaskById(id: string): Promise<Task | null> {
  const token = getStoredToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Not found');
    return await res.json();
  } catch {
    return getLocalTasks().find(t => t.id === id) ?? null;
  }
}

export async function apiCreateTask(dto: Partial<Task>): Promise<Task> {
  const token = getStoredToken();
  try {
    const res = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });
    if (!res.ok) throw new Error('Failed to create task');
    return await res.json();
  } catch (error) {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: dto.title || 'New Task',
      description: dto.description || '',
      status: dto.status || 'To Do',
      priority: dto.priority || 'MEDIUM',
      category: dto.category || 'Deployment',
      assigneeName: dto.assigneeName || 'Admin',
      tags: dto.tags || 'Deployment,Deployment',
      dueDate: dto.dueDate || '29 Jul',
      createdAt: new Date().toISOString(),
    };
    saveLocalTask(newTask);
    return newTask;
  }
}

export async function apiUpdateTask(id: string, dto: Partial<Task>): Promise<Task> {
  const token = getStoredToken();
  try {
    const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });
    if (!res.ok) throw new Error('Failed to update task');
    return await res.json();
  } catch (error) {
    updateLocalTask(id, dto);
    const updated = getLocalTasks().find(t => t.id === id);
    return updated || (dto as Task);
  }
}

export async function apiDeleteTask(id: string): Promise<void> {
  const token = getStoredToken();
  try {
    await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    deleteLocalTask(id);
  }
}

// ─── Project data ────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  priority: string;
  lead: string;
  dueDate: string;
  status: string;
  team: string;
  labels: string;
  _count?: { tasks: number };
}

export async function apiFetchProjects(): Promise<Project[]> {
  const token = getStoredToken();
  if (!token) return [];
  try {
    const res = await fetch(`${API_BASE_URL}/projects`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch projects');
    return await res.json();
  } catch {
    return [];
  }
}

export async function apiGetProjectById(id: string): Promise<Project | null> {
  const token = getStoredToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Not found');
    return await res.json();
  } catch {
    return null;
  }
}

export async function apiCreateProject(dto: Partial<Project>): Promise<Project> {
  const token = getStoredToken();
  const res = await fetch(`${API_BASE_URL}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error('Failed to create project');
  return await res.json();
}

export async function apiUpdateProject(id: string, dto: Partial<Project>): Promise<Project> {
  const token = getStoredToken();
  const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error('Failed to update project');
  return await res.json();
}

export async function apiDeleteProject(id: string): Promise<void> {
  const token = getStoredToken();
  await fetch(`${API_BASE_URL}/projects/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function apiFetchProjectTasks(projectId: string): Promise<Task[]> {
  const token = getStoredToken();
  if (!token) return [];
  try {
    const res = await fetch(`${API_BASE_URL}/tasks?projectId=${projectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch project tasks');
    return await res.json();
  } catch {
    return [];
  }
}

export async function apiCreateProjectTask(projectId: string, dto: Partial<Task>): Promise<Task> {
  const token = getStoredToken();
  const res = await fetch(`${API_BASE_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ...dto, projectId }),
  });
  if (!res.ok) throw new Error('Failed to create task');
  return await res.json();
}

export async function apiUpdateProjectTask(projectId: string, taskId: string, dto: Partial<Task>): Promise<Task> {
  const token = getStoredToken();
  const res = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error('Failed to update task');
  return await res.json();
}

export async function apiDeleteProjectTask(projectId: string, taskId: string): Promise<void> {
  const token = getStoredToken();
  await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Initial seed tasks matching Figma Screen 2
const FIGMA_INITIAL_TASKS: Task[] = [
  // To Do
  { id: '1', title: 'Write API Documentation', status: 'To Do', assigneeName: 'Admin', dueDate: '29 Jul', tags: 'Deployment,Deployment', priority: 'HIGH' },
  { id: '2', title: 'Implement Search Function', status: 'To Do', assigneeName: 'Admin', dueDate: '29 Jul', tags: 'Deployment,Deployment', priority: 'MEDIUM' },
  { id: '3', title: 'Deploy to Production', status: 'To Do', assigneeName: 'Admin', dueDate: '29 Jul', tags: 'Deployment,Deployment', priority: 'URGENT' },
  
  // Doing
  { id: '4', title: 'Code Review Completed', status: 'Doing', assigneeName: 'Admin', dueDate: '29 Jul', tags: 'Deployment,Deployment', priority: 'HIGH' },
  { id: '5', title: 'Design Mockups Finalized', status: 'Doing', assigneeName: 'Admin', dueDate: '29 Jul', tags: 'Deployment,Deployment', priority: 'MEDIUM' },
  
  // Completed
  { id: '6', title: 'Feature Testing Passed', status: 'Completed', assigneeName: 'QA Team', dueDate: '30 Jul', tags: 'Testing,Passed', priority: 'LOW' },
  { id: '7', title: 'UI Design Updated', status: 'Completed', assigneeName: 'Designer', dueDate: '31 Jul', tags: 'Design,Updated', priority: 'MEDIUM' },
  { id: '8', title: 'Security Audit Scheduled', status: 'Completed', assigneeName: 'Security', dueDate: '01 Aug', tags: 'Audit,Scheduled', priority: 'HIGH' },
  
  // On Hold
  { id: '9', title: 'UI Review', status: 'On Hold', assigneeName: 'Design', dueDate: '02 Aug', tags: 'Review', priority: 'LOW' },
  { id: '10', title: 'Backend Integration', status: 'On Hold', assigneeName: 'Dev Team', dueDate: '03 Aug', tags: 'Development', priority: 'HIGH' },
  { id: '11', title: 'User Feedback', status: 'On Hold', assigneeName: 'Product', dueDate: '04 Aug', tags: 'Research', priority: 'MEDIUM' },
  { id: '12', title: 'Performance Audit', status: 'On Hold', assigneeName: 'Engineering', dueDate: '05 Aug', tags: 'Optimization', priority: 'URGENT' },
];

function getLocalTasks(): Task[] {
  if (typeof window === 'undefined') return FIGMA_INITIAL_TASKS;
  const raw = localStorage.getItem('pyramid_local_kanban_tasks');
  if (!raw) {
    localStorage.setItem('pyramid_local_kanban_tasks', JSON.stringify(FIGMA_INITIAL_TASKS));
    return FIGMA_INITIAL_TASKS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return FIGMA_INITIAL_TASKS;
  }
}

function saveLocalTask(task: Task) {
  const list = getLocalTasks();
  list.push(task);
  localStorage.setItem('pyramid_local_kanban_tasks', JSON.stringify(list));
}

function updateLocalTask(id: string, dto: Partial<Task>) {
  const list = getLocalTasks();
  const index = list.findIndex(t => t.id === id);
  if (index !== -1) {
    list[index] = { ...list[index], ...dto };
    localStorage.setItem('pyramid_local_kanban_tasks', JSON.stringify(list));
  }
}

function deleteLocalTask(id: string) {
  const list = getLocalTasks().filter(t => t.id !== id);
  localStorage.setItem('pyramid_local_kanban_tasks', JSON.stringify(list));
}
