import { Router, Response } from 'express';
import { DiaryStore } from '../db.ts';
import { AuthRequest, authMiddleware } from '../middleware/auth.ts';

const router = Router();
router.use(authMiddleware);

// List all diary entries for logged in user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { search, date } = req.query;
    let entries = await DiaryStore.find({ userId: req.userId! });

    if (date && typeof date === 'string') {
      entries = entries.filter((e) => e.date === date);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      entries = entries.filter(
        (e) =>
          (e.title && e.title.toLowerCase().includes(q)) ||
          (e.content && e.content.toLowerCase().includes(q)) ||
          (Array.isArray(e.tags) && e.tags.some((t: string) => t && t.toLowerCase().includes(q)))
      );
    }

    // Sort by date descending, then createdAt descending
    entries.sort((a, b) => {
      const dateA = new Date(a.date).getTime() || new Date(a.createdAt).getTime();
      const dateB = new Date(b.date).getTime() || new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    return res.json({ entries });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch diary entries.' });
  }
});

// Get single entry
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const entry = await DiaryStore.findById(req.params.id);
    if (!entry || entry.userId !== req.userId) {
      return res.status(404).json({ error: 'Diary entry not found.' });
    }
    return res.json({ entry });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch entry.' });
  }
});

// Create entry
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, date, mood, tags, coverStyle } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const entry = await DiaryStore.create({
      userId: req.userId!,
      title: title.trim(),
      content,
      date: date || todayStr,
      mood: mood || 'reflective',
      tags: Array.isArray(tags) ? tags : [],
      coverStyle: coverStyle || 'leather',
    });

    return res.status(201).json({ message: 'Diary entry created.', entry });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create diary entry.' });
  }
});

// Update entry
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await DiaryStore.findById(req.params.id);
    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({ error: 'Diary entry not found.' });
    }

    const { title, content, date, mood, tags, coverStyle } = req.body;
    const updateData: Record<string, any> = {};

    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) updateData.content = content;
    if (date !== undefined) updateData.date = date;
    if (mood !== undefined) updateData.mood = mood;
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [];
    if (coverStyle !== undefined) updateData.coverStyle = coverStyle;

    const updated = await DiaryStore.findByIdAndUpdate(req.params.id, updateData);
    return res.json({ message: 'Diary entry updated.', entry: updated });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update diary entry.' });
  }
});

// Delete entry
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await DiaryStore.findById(req.params.id);
    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({ error: 'Diary entry not found.' });
    }

    await DiaryStore.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Diary entry deleted successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete diary entry.' });
  }
});

export default router;
