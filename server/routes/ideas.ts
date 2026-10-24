import { Router, Response } from 'express';
import { IdeaStore } from '../db.ts';
import { AuthRequest, authMiddleware } from '../middleware/auth.ts';

const router = Router();
router.use(authMiddleware);

// List ideas
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { category, status, search } = req.query;
    let ideas = await IdeaStore.find({ userId: req.userId! });

    if (category && typeof category === 'string' && category !== 'All') {
      ideas = ideas.filter((i) => i.category.toLowerCase() === category.toLowerCase());
    }

    if (status && typeof status === 'string' && status !== 'All') {
      ideas = ideas.filter((i) => i.status.toLowerCase() === status.toLowerCase());
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      ideas = ideas.filter(
        (i) =>
          (i.title && i.title.toLowerCase().includes(q)) ||
          (i.description && i.description.toLowerCase().includes(q)) ||
          (i.notes && i.notes.toLowerCase().includes(q)) ||
          (Array.isArray(i.tags) && i.tags.some((t: string) => t && t.toLowerCase().includes(q)))
      );
    }

    // Sort newest first
    ideas.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.json({ ideas });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch ideas.' });
  }
});

// Single idea
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const idea = await IdeaStore.findById(req.params.id);
    if (!idea || idea.userId !== req.userId) {
      return res.status(404).json({ error: 'Idea not found.' });
    }
    return res.json({ idea });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch idea.' });
  }
});

// Create idea
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, category, status, tags, notes } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required.' });
    }

    const validStatuses = ['Draft', 'In Progress', 'Completed'];
    const chosenStatus = validStatuses.includes(status) ? status : 'Draft';

    const idea = await IdeaStore.create({
      userId: req.userId!,
      title: title.trim(),
      description: description.trim(),
      category: category ? category.trim() : 'General',
      status: chosenStatus,
      tags: Array.isArray(tags) ? tags : [],
      notes: notes || '',
    });

    return res.status(201).json({ message: 'Idea created.', idea });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create idea.' });
  }
});

// Update idea
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await IdeaStore.findById(req.params.id);
    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({ error: 'Idea not found.' });
    }

    const { title, description, category, status, tags, notes } = req.body;
    const updateData: Record<string, any> = {};

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (category !== undefined) updateData.category = category.trim();
    if (status !== undefined) {
      const validStatuses = ['Draft', 'In Progress', 'Completed'];
      if (validStatuses.includes(status)) updateData.status = status;
    }
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [];
    if (notes !== undefined) updateData.notes = notes;

    const updated = await IdeaStore.findByIdAndUpdate(req.params.id, updateData);
    return res.json({ message: 'Idea updated.', idea: updated });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update idea.' });
  }
});

// Delete idea
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await IdeaStore.findById(req.params.id);
    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({ error: 'Idea not found.' });
    }

    await IdeaStore.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Idea deleted successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete idea.' });
  }
});

export default router;
