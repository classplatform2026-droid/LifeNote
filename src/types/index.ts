export type NavigationTab = 'bookshelf' | 'diary' | 'ideas' | 'milestone' | 'notebooks' | 'settings';

export type AILanguage = 'bangla' | 'english' | 'unique';

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'sepia';
  readingFont?: 'serif' | 'sans';
  bookCover?: 'leather' | 'linen' | 'charcoal' | 'parchment';
}

export interface User {
  _id: string;
  name: string;
  email: string;
  preferences?: UserPreferences;
  createdAt?: string;
}

export interface DiaryEntry {
  _id: string;
  userId: string;
  title: string;
  content: string;
  date: string;
  mood: 'calm' | 'inspired' | 'reflective' | 'grateful' | 'energetic' | 'focused';
  tags: string[];
  coverStyle: 'leather' | 'linen' | 'charcoal' | 'parchment';
  wordCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Idea {
  _id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  status: 'Draft' | 'In Progress' | 'Completed';
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GoalTask {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
}

export interface Goal {
  _id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High';
  deadline?: string;
  status: 'Active' | 'Completed' | 'Archived';
  progress: number;
  tasks: GoalTask[];
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  _id: string;
  userId: string;
  notebookId: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Notebook {
  _id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  coverStyle: 'leather' | 'linen' | 'charcoal' | 'parchment';
  color: string;
  noteCount?: number;
  notes?: Note[];
  createdAt: string;
  updatedAt: string;
}

export interface BookItem {
  id: string;
  type: 'notebook' | 'diary';
  title: string;
  subtitle?: string;
  category?: string;
  coverStyle: 'leather' | 'linen' | 'charcoal' | 'parchment';
  updatedAt: string;
  itemCount: number;
  data: Notebook | DiaryEntry | { entries: DiaryEntry[] };
}
