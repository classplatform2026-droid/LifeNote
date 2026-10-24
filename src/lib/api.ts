const TOKEN_KEY = 'lifenote_jwt_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (e) {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (e) {}
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.error || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (body: { name: string; email: string; password: string }) =>
    request<{ token: string; user: any }>('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    request<{ token: string; user: any }>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request<{ user: any }>('/api/auth/me'),
  updateProfile: (body: { name?: string; preferences?: any }) =>
    request<{ user: any }>('/api/auth/profile', { method: 'PUT', body: JSON.stringify(body) }),
  updatePassword: (body: { currentPassword: string; newPassword: string }) =>
    request<{ message: string }>('/api/auth/password', { method: 'PUT', body: JSON.stringify(body) }),

  // Diary
  getDiaryEntries: (params?: { search?: string; date?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.date) query.set('date', params.date);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<{ entries: any[] }>(`/api/diary${qs}`);
  },
  getDiaryEntry: (id: string) => request<{ entry: any }>(`/api/diary/${id}`),
  createDiaryEntry: (body: any) =>
    request<{ entry: any }>('/api/diary', { method: 'POST', body: JSON.stringify(body) }),
  updateDiaryEntry: (id: string, body: any) =>
    request<{ entry: any }>(`/api/diary/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteDiaryEntry: (id: string) =>
    request<{ message: string }>(`/api/diary/${id}`, { method: 'DELETE' }),

  // Ideas
  getIdeas: (params?: { category?: string; status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<{ ideas: any[] }>(`/api/ideas${qs}`);
  },
  createIdea: (body: any) =>
    request<{ idea: any }>('/api/ideas', { method: 'POST', body: JSON.stringify(body) }),
  updateIdea: (id: string, body: any) =>
    request<{ idea: any }>(`/api/ideas/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteIdea: (id: string) =>
    request<{ message: string }>(`/api/ideas/${id}`, { method: 'DELETE' }),

  // Goals
  getGoals: (params?: { category?: string; priority?: string; status?: string; search?: string; sortBy?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.priority) query.set('priority', params.priority);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    if (params?.sortBy) query.set('sortBy', params.sortBy);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<{ goals: any[] }>(`/api/goals${qs}`);
  },
  createGoal: (body: any) =>
    request<{ goal: any }>('/api/goals', { method: 'POST', body: JSON.stringify(body) }),
  updateGoal: (id: string, body: any) =>
    request<{ goal: any }>(`/api/goals/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  updateTask: (goalId: string, taskId: string, body: any) =>
    request<{ goal: any }>(`/api/goals/${goalId}/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(body) }),
  addTask: (goalId: string, body: any) =>
    request<{ goal: any; task: any }>(`/api/goals/${goalId}/tasks`, { method: 'POST', body: JSON.stringify(body) }),
  deleteTask: (goalId: string, taskId: string) =>
    request<{ goal: any }>(`/api/goals/${goalId}/tasks/${taskId}`, { method: 'DELETE' }),
  deleteGoal: (id: string) =>
    request<{ message: string }>(`/api/goals/${id}`, { method: 'DELETE' }),

  // Notebooks
  getNotebooks: () => request<{ notebooks: any[] }>('/api/notebooks'),
  getNotebook: (id: string) => request<{ notebook: any; notes: any[] }>(`/api/notebooks/${id}`),
  createNotebook: (body: any) =>
    request<{ notebook: any }>('/api/notebooks', { method: 'POST', body: JSON.stringify(body) }),
  updateNotebook: (id: string, body: any) =>
    request<{ notebook: any }>(`/api/notebooks/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteNotebook: (id: string) =>
    request<{ message: string }>(`/api/notebooks/${id}`, { method: 'DELETE' }),

  // Notes
  getNotes: (notebookId: string, search?: string) => {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return request<{ notes: any[] }>(`/api/notebooks/${notebookId}/notes${qs}`);
  },
  createNote: (notebookId: string, body: any) =>
    request<{ note: any }>(`/api/notebooks/${notebookId}/notes`, { method: 'POST', body: JSON.stringify(body) }),
  updateNote: (notebookId: string, noteId: string, body: any) =>
    request<{ note: any }>(`/api/notebooks/${notebookId}/notes/${noteId}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteNote: (notebookId: string, noteId: string) =>
    request<{ message: string }>(`/api/notebooks/${notebookId}/notes/${noteId}`, { method: 'DELETE' }),

  // AI
  improveDiary: (body: { content: string; tone?: string; focus?: string; language?: string; customCommand?: string }) =>
    request<{ improvedContent: string; changesSummary: string; originalWordCount?: number; improvedWordCount?: number }>(
      '/api/ai/diary/improve',
      { method: 'POST', body: JSON.stringify(body) }
    ),
  improveDiaryEntry: (body: { content: string; tone?: string; focus?: string; language?: string; customCommand?: string }) =>
    request<{ improvedContent: string; changesSummary: string; originalWordCount?: number; improvedWordCount?: number }>(
      '/api/ai/diary/improve',
      { method: 'POST', body: JSON.stringify(body) }
    ),
  developIdea: (body: { title: string; description: string; notes?: string; category?: string; language?: string; customCommand?: string }) =>
    request<{
      clarifiedTitle: string;
      organizedSummary: string;
      corePillars: string[];
      actionSteps: string[];
      suggestedNotes: string;
    }>('/api/ai/ideas/develop', { method: 'POST', body: JSON.stringify(body) }),
  planGoal: (body: { title: string; description?: string; deadline?: string; category?: string; currentTasks?: any[]; language?: string }) =>
    request<{ strategicSummary: string; suggestedTasks: Array<{ title: string; dueDate?: string }> }>(
      '/api/ai/goals/plan',
      { method: 'POST', body: JSON.stringify(body) }
    ),
  generateGoalPlan: (body: { title: string; description?: string; deadline?: string; category?: string; currentTasks?: any[]; language?: string }) =>
    request<{ strategicSummary: string; suggestedTasks: Array<{ title: string; dueDate?: string }> }>(
      '/api/ai/goals/plan',
      { method: 'POST', body: JSON.stringify(body) }
    ),
  refineNote: (body: { content: string; action: string; noteTitle?: string; language?: string; customCommand?: string }) =>
    request<{ refinedContent: string; summary: string }>('/api/ai/notes/refine', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};
