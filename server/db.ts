import fs from 'fs';
import path from 'path';
import mongoose, { Schema } from 'mongoose';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Check if external MongoDB URI is provided
const MONGODB_URI = process.env.MONGODB_URI || '';
let isMongoConnected = false;

if (MONGODB_URI) {
  mongoose
    .connect(MONGODB_URI)
    .then(() => {
      isMongoConnected = true;
      console.log('Connected to MongoDB via Mongoose');
    })
    .catch((err) => {
      console.warn('Mongoose connection failed, falling back to persistent file store:', err.message);
    });
}

// Generic file-based persistent store that mirrors Mongoose model behavior
class PersistentStore<T extends { _id: string; [key: string]: any }> {
  private filePath: string;
  private memoryData: T[] = [];

  constructor(collectionName: string) {
    this.filePath = path.join(DATA_DIR, `${collectionName}.json`);
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.memoryData = JSON.parse(raw);
      } else {
        this.memoryData = [];
        this.save();
      }
    } catch (e) {
      this.memoryData = [];
    }
  }

  private save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.memoryData, null, 2), 'utf-8');
    } catch (e) {
      console.error(`Failed to save store ${this.filePath}`, e);
    }
  }

  async find(query: Record<string, any> = {}): Promise<T[]> {
    return this.memoryData.filter((item) => {
      for (const key of Object.keys(query)) {
        if (query[key] !== undefined && item[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
  }

  async findOne(query: Record<string, any>): Promise<T | null> {
    const list = await this.find(query);
    return list[0] || null;
  }

  async findById(id: string): Promise<T | null> {
    return this.memoryData.find((item) => item._id === id) || null;
  }

  async create(data: Partial<T>): Promise<T> {
    const now = new Date().toISOString();
    const doc = {
      _id: 'doc_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now(),
      createdAt: now,
      updatedAt: now,
      ...data,
    } as unknown as T;
    this.memoryData.unshift(doc);
    this.save();
    return doc;
  }

  async findByIdAndUpdate(id: string, update: Record<string, any>): Promise<T | null> {
    const idx = this.memoryData.findIndex((item) => item._id === id);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    this.memoryData[idx] = {
      ...this.memoryData[idx],
      ...update,
      updatedAt: now,
    };
    this.save();
    return this.memoryData[idx];
  }

  async findByIdAndDelete(id: string): Promise<T | null> {
    const idx = this.memoryData.findIndex((item) => item._id === id);
    if (idx === -1) return null;
    const [deleted] = this.memoryData.splice(idx, 1);
    this.save();
    return deleted;
  }

  async deleteMany(query: Record<string, any>): Promise<number> {
    const prevCount = this.memoryData.length;
    this.memoryData = this.memoryData.filter((item) => {
      for (const key of Object.keys(query)) {
        if (item[key] === query[key]) return false;
      }
      return true;
    });
    this.save();
    return prevCount - this.memoryData.length;
  }
}

// Persistent stores
export const UserStore = new PersistentStore<any>('users');
export const DiaryStore = new PersistentStore<any>('diary_entries');
export const IdeaStore = new PersistentStore<any>('ideas');
export const GoalStore = new PersistentStore<any>('goals');
export const NotebookStore = new PersistentStore<any>('notebooks');
export const NoteStore = new PersistentStore<any>('notes');

// Also define formal Mongoose Schemas for strict schema validation
export const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    preferences: {
      theme: { type: String, default: 'light' },
      readingFont: { type: String, default: 'serif' },
      bookCover: { type: String, default: 'leather' },
    },
  },
  { timestamps: true }
);

export const DiarySchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    date: { type: String, required: true },
    mood: { type: String, default: 'reflective' },
    tags: [{ type: String }],
    coverStyle: { type: String, default: 'leather' },
  },
  { timestamps: true }
);

export const IdeaSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, default: 'General' },
    status: { type: String, enum: ['Draft', 'In Progress', 'Completed'], default: 'Draft' },
    tags: [{ type: String }],
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const GoalSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'Personal' },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    deadline: { type: String, default: '' },
    status: { type: String, enum: ['Active', 'Completed', 'Archived'], default: 'Active' },
    progress: { type: Number, default: 0 },
    tasks: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true },
        completed: { type: Boolean, default: false },
        dueDate: { type: String, default: '' },
      },
    ],
  },
  { timestamps: true }
);

export const NotebookSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'General' },
    coverStyle: { type: String, enum: ['leather', 'linen', 'charcoal', 'parchment'], default: 'leather' },
    color: { type: String, default: '#1a1a1a' },
  },
  { timestamps: true }
);

export const NoteSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    notebookId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    content: { type: String, default: '' },
    tags: [{ type: String }],
    pinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);
