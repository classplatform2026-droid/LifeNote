import { Router, Response } from 'express';
import { NotebookStore, NoteStore } from '../db.ts';
import { AuthRequest, authMiddleware } from '../middleware/auth.ts';

const router = Router();
router.use(authMiddleware);

// --- NOTEBOOKS ---

// List all notebooks for logged in user (with note count)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const notebooks = await NotebookStore.find({ userId: req.userId! });
    const notes = await NoteStore.find({ userId: req.userId! });

    // Attach noteCount and lastUpdated
    const notebooksWithMeta = notebooks.map((nb) => {
      const bookNotes = notes.filter((n) => n.notebookId === nb._id);
      return {
        ...nb,
        noteCount: bookNotes.length,
        notes: bookNotes,
      };
    });

    notebooksWithMeta.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return res.json({ notebooks: notebooksWithMeta });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch notebooks.' });
  }
});

// Single notebook with notes
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const notebook = await NotebookStore.findById(req.params.id);
    if (!notebook || notebook.userId !== req.userId) {
      return res.status(404).json({ error: 'Notebook not found.' });
    }

    const notes = await NoteStore.find({ notebookId: req.params.id, userId: req.userId! });
    notes.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return res.json({ notebook, notes });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch notebook.' });
  }
});

// Create notebook
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, category, coverStyle, color } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Notebook title is required.' });
    }

    const validCovers = ['leather', 'linen', 'charcoal', 'parchment'];
    const chosenCover = validCovers.includes(coverStyle) ? coverStyle : 'leather';

    const notebook = await NotebookStore.create({
      userId: req.userId!,
      title: title.trim(),
      description: description ? description.trim() : '',
      category: category ? category.trim() : 'General',
      coverStyle: chosenCover,
      color: color || '#1a1a1a',
    });

    return res.status(201).json({ message: 'Notebook created.', notebook });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create notebook.' });
  }
});

// Update notebook
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await NotebookStore.findById(req.params.id);
    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({ error: 'Notebook not found.' });
    }

    const { title, description, category, coverStyle, color } = req.body;
    const updateData: Record<string, any> = {};

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category.trim();
    if (coverStyle !== undefined) {
      const validCovers = ['leather', 'linen', 'charcoal', 'parchment'];
      if (validCovers.includes(coverStyle)) updateData.coverStyle = coverStyle;
    }
    if (color !== undefined) updateData.color = color;

    const updated = await NotebookStore.findByIdAndUpdate(req.params.id, updateData);
    return res.json({ message: 'Notebook updated.', notebook: updated });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update notebook.' });
  }
});

// Delete notebook (and cascade delete notes in that notebook)
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await NotebookStore.findById(req.params.id);
    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({ error: 'Notebook not found.' });
    }

    await NotebookStore.findByIdAndDelete(req.params.id);
    await NoteStore.deleteMany({ notebookId: req.params.id, userId: req.userId! });

    return res.json({ message: 'Notebook and its notes deleted successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete notebook.' });
  }
});

// --- NOTES INSIDE NOTEBOOK ---

// List notes with optional search across notes
router.get('/:id/notes', async (req: AuthRequest, res: Response) => {
  try {
    const notebook = await NotebookStore.findById(req.params.id);
    if (!notebook || notebook.userId !== req.userId) {
      return res.status(404).json({ error: 'Notebook not found.' });
    }

    const { search } = req.query;
    let notes = await NoteStore.find({ notebookId: req.params.id, userId: req.userId! });

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      notes = notes.filter(
        (n) =>
          (n.title && n.title.toLowerCase().includes(q)) ||
          (n.content && n.content.toLowerCase().includes(q)) ||
          (Array.isArray(n.tags) && n.tags.some((t: string) => t && t.toLowerCase().includes(q)))
      );
    }

    notes.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return res.json({ notes });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch notes.' });
  }
});

// Create note
router.post('/:id/notes', async (req: AuthRequest, res: Response) => {
  try {
    const notebook = await NotebookStore.findById(req.params.id);
    if (!notebook || notebook.userId !== req.userId) {
      return res.status(404).json({ error: 'Notebook not found.' });
    }

    const { title, content, tags, pinned } = req.body;
    const note = await NoteStore.create({
      userId: req.userId!,
      notebookId: req.params.id,
      title: (title || 'Untitled Note').trim(),
      content: content || '',
      tags: Array.isArray(tags) ? tags : [],
      pinned: !!pinned,
    });

    // Touch notebook updatedAt
    await NotebookStore.findByIdAndUpdate(req.params.id, {});

    return res.status(201).json({ message: 'Note created.', note });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create note.' });
  }
});

// Update note
router.put('/:id/notes/:noteId', async (req: AuthRequest, res: Response) => {
  try {
    const note = await NoteStore.findById(req.params.noteId);
    if (!note || note.userId !== req.userId || note.notebookId !== req.params.id) {
      return res.status(404).json({ error: 'Note not found.' });
    }

    const { title, content, tags, pinned } = req.body;
    const updateData: Record<string, any> = {};

    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) updateData.content = content;
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [];
    if (pinned !== undefined) updateData.pinned = !!pinned;

    const updated = await NoteStore.findByIdAndUpdate(req.params.noteId, updateData);
    await NotebookStore.findByIdAndUpdate(req.params.id, {});

    return res.json({ message: 'Note updated.', note: updated });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update note.' });
  }
});

// Delete note
router.delete('/:id/notes/:noteId', async (req: AuthRequest, res: Response) => {
  try {
    const note = await NoteStore.findById(req.params.noteId);
    if (!note || note.userId !== req.userId || note.notebookId !== req.params.id) {
      return res.status(404).json({ error: 'Note not found.' });
    }

    await NoteStore.findByIdAndDelete(req.params.noteId);
    return res.json({ message: 'Note deleted successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete note.' });
  }
});

export default router;
