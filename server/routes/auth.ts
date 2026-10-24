import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { UserStore, NotebookStore, NoteStore, DiaryStore, IdeaStore, GoalStore } from '../db.ts';
import { AuthRequest, authMiddleware, generateToken } from '../middleware/auth.ts';

const router = Router();

// Helper to seed initial sample data for a delightful first experience
async function seedInitialUserData(userId: string) {
  // Check if user already has data
  const existingNotebooks = await NotebookStore.find({ userId });
  if (existingNotebooks.length > 0) return;

  // 1. Create a Master Notebook
  const notebook = await NotebookStore.create({
    userId,
    title: 'Meditations & Craft',
    description: 'Personal philosophy, creative architecture, and core principles.',
    category: 'Philosophy',
    coverStyle: 'leather',
    color: '#1e293b',
  });

  // Note 1
  await NoteStore.create({
    userId,
    notebookId: notebook._id,
    title: 'The Art of Deliberate Living',
    content: '<h2>Principles of Attention</h2><p>In a world of perpetual distraction, focused stillness is the ultimate competitive advantage. When writing, eliminate every decorative word. When designing, eliminate every spurious control.</p><blockquote>"Simplicity is the prerequisite for reliability." — Edsger W. Dijkstra</blockquote><p>Write with quiet conviction. Let your actions speak louder than promises.</p>',
    tags: ['Philosophy', 'Focus', 'Writing'],
    pinned: true,
  });

  // Note 2
  await NoteStore.create({
    userId,
    notebookId: notebook._id,
    title: 'Writing Systems & Rhythm',
    content: '<p>A writer’s notebook should be both a laboratory and an archive. Capture raw fragments immediately; refine them with patience. A good sentence has balance, cadenced pauses, and organic weight.</p>',
    tags: ['Craft', 'Systems'],
    pinned: false,
  });

  // 2. Create an initial Diary entry
  const today = new Date().toISOString().split('T')[0];
  await DiaryStore.create({
    userId,
    title: 'Morning Stillness & Fresh Beginnings',
    content: '<p>The morning arrived with soft, cool light through the window. Started the day with black coffee and forty minutes of deep reading before the digital world began its clamor.</p><p>Reflecting on progress: clarity comes not from adding more commitments, but from stripping away what does not matter. Committed to finishing the key project milestones this week with uninterrupted focus.</p>',
    date: today,
    mood: 'inspired',
    tags: ['Clarity', 'Morning', 'Reflections'],
    coverStyle: 'linen',
  });

  // 3. Create sample Idea
  await IdeaStore.create({
    userId,
    title: 'Modular Thought Garden',
    description: 'A personal knowledge repository connecting journal reflections with actionable project milestones through semantic associations.',
    category: 'Creative',
    status: 'In Progress',
    tags: ['Knowledge', 'Systems', 'Design'],
    notes: 'Key questions: How to preserve zero-friction drafting while providing deep structured retrieval?',
  });

  // 4. Create sample Milestone Goal
  const deadlineDate = new Date();
  deadlineDate.setDate(deadlineDate.getDate() + 30);
  const deadlineStr = deadlineDate.toISOString().split('T')[0];

  await GoalStore.create({
    userId,
    title: 'Publish First Essay Collection',
    description: 'Curate, edit, and bind a 5-part reflective monograph on modern craft and focus.',
    category: 'Creative',
    priority: 'High',
    deadline: deadlineStr,
    status: 'Active',
    progress: 50,
    tasks: [
      { id: 'task_1', title: 'Outline core thesis and 5 chapter themes', completed: true, dueDate: today },
      { id: 'task_2', title: 'Draft chapter 1: The Still Mind', completed: true, dueDate: today },
      { id: 'task_3', title: 'Draft chapter 2: Tools of Conviction', completed: false, dueDate: deadlineStr },
      { id: 'task_4', title: 'Final line edit and typographic typesetting', completed: false, dueDate: deadlineStr },
    ],
  });
}

// Register
router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await UserStore.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await UserStore.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      preferences: {
        theme: 'light',
        readingFont: 'serif',
        bookCover: 'leather',
      },
    });

    await seedInitialUserData(user._id);

    const token = generateToken(user._id);
    return res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
      },
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

// Login
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await UserStore.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user._id);
    return res.json({
      message: 'Signed in successfully.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Failed to sign in. Please try again.' });
  }
});

// Me (Check session)
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  return res.json({ user: req.user });
});

// Update profile / preferences
router.put('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, preferences } = req.body;
    const update: Record<string, any> = {};

    if (name && typeof name === 'string') {
      update.name = name.trim();
    }

    if (preferences && typeof preferences === 'object') {
      const currentUser = await UserStore.findById(req.userId!);
      update.preferences = {
        ...currentUser?.preferences,
        ...preferences,
      };
    }

    const updated = await UserStore.findByIdAndUpdate(req.userId!, update);
    return res.json({
      message: 'Profile updated successfully.',
      user: {
        _id: updated._id,
        name: updated.name,
        email: updated.email,
        preferences: updated.preferences,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// Change password
router.put('/password', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const user = await UserStore.findById(req.userId!);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password does not match.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await UserStore.findByIdAndUpdate(req.userId!, { password: hashedPassword });

    return res.json({ message: 'Password updated successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update password.' });
  }
});

export default router;
