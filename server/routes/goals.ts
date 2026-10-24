import { Router, Response } from 'express';
import { GoalStore } from '../db.ts';
import { AuthRequest, authMiddleware } from '../middleware/auth.ts';

const router = Router();
router.use(authMiddleware);

// Helper to compute progress percentage accurately
function computeProgress(tasks: Array<{ completed: boolean }>): number {
  if (!tasks || tasks.length === 0) return 0;
  const completed = tasks.filter((t) => t.completed).length;
  return Math.round((completed / tasks.length) * 100);
}

// List goals
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { category, priority, status, search, sortBy } = req.query;
    let goals = await GoalStore.find({ userId: req.userId! });

    if (category && typeof category === 'string' && category !== 'All') {
      goals = goals.filter((g) => g.category.toLowerCase() === category.toLowerCase());
    }

    if (priority && typeof priority === 'string' && priority !== 'All') {
      goals = goals.filter((g) => g.priority.toLowerCase() === priority.toLowerCase());
    }

    if (status && typeof status === 'string' && status !== 'All') {
      goals = goals.filter((g) => g.status.toLowerCase() === status.toLowerCase());
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.toLowerCase().trim();
      goals = goals.filter((g) =>
        (g.title && g.title.toLowerCase().includes(q)) ||
        (g.description && g.description.toLowerCase().includes(q)) ||
        (g.category && g.category.toLowerCase().includes(q)) ||
        (Array.isArray(g.tasks) && g.tasks.some((t: any) => t && t.title && t.title.toLowerCase().includes(q)))
      );
    }

    // Sort: High priority, deadline, progress, or newest
    const priorityWeight: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
    if (sortBy === 'deadline') {
      goals.sort((a, b) => new Date(a.deadline || '2099-12-31').getTime() - new Date(b.deadline || '2099-12-31').getTime());
    } else if (sortBy === 'progress') {
      goals.sort((a, b) => (b.progress || 0) - (a.progress || 0));
    } else if (sortBy === 'newest') {
      goals.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else {
      // Default: Priority then deadline
      goals.sort((a, b) => {
        const pDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
        if (pDiff !== 0) return pDiff;
        return new Date(a.deadline || '2099-12-31').getTime() - new Date(b.deadline || '2099-12-31').getTime();
      });
    }

    return res.json({ goals });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch goals.' });
  }
});

// Single goal
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const goal = await GoalStore.findById(req.params.id);
    if (!goal || goal.userId !== req.userId) {
      return res.status(404).json({ error: 'Goal not found.' });
    }
    return res.json({ goal });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch goal.' });
  }
});

// Create goal
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, category, priority, deadline, tasks } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Goal title is required.' });
    }

    const initialTasks = Array.isArray(tasks)
      ? tasks.map((t: any) => ({
          id: t.id || 'task_' + Math.random().toString(36).substring(2, 9),
          title: (t.title || 'Untitled task').trim(),
          completed: !!t.completed,
          dueDate: t.dueDate || '',
        }))
      : [];

    const progress = computeProgress(initialTasks);

    const goal = await GoalStore.create({
      userId: req.userId!,
      title: title.trim(),
      description: description || '',
      category: category ? category.trim() : 'Personal',
      priority: ['High', 'Medium', 'Low'].includes(priority) ? priority : 'Medium',
      deadline: deadline || '',
      status: 'Active',
      tasks: initialTasks,
      progress,
    });

    return res.status(201).json({ message: 'Goal created.', goal });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create goal.' });
  }
});

// Update goal details
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await GoalStore.findById(req.params.id);
    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({ error: 'Goal not found.' });
    }

    const { title, description, category, priority, deadline, status, tasks } = req.body;
    const updateData: Record<string, any> = {};

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category.trim();
    if (priority !== undefined) {
      if (['High', 'Medium', 'Low'].includes(priority)) updateData.priority = priority;
    }
    if (deadline !== undefined) updateData.deadline = deadline;
    if (status !== undefined) {
      if (['Active', 'Completed', 'Archived'].includes(status)) updateData.status = status;
    }

    if (Array.isArray(tasks)) {
      updateData.tasks = tasks.map((t: any) => ({
        id: t.id || 'task_' + Math.random().toString(36).substring(2, 9),
        title: (t.title || '').trim(),
        completed: !!t.completed,
        dueDate: t.dueDate || '',
      }));
      updateData.progress = computeProgress(updateData.tasks);
      if (updateData.progress === 100 && updateData.status !== 'Archived') {
        updateData.status = 'Completed';
      } else if (updateData.progress < 100 && existing.status === 'Completed') {
        updateData.status = 'Active';
      }
    }

    const updated = await GoalStore.findByIdAndUpdate(req.params.id, updateData);
    return res.json({ message: 'Goal updated.', goal: updated });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update goal.' });
  }
});

// Toggle or edit individual task inside a goal
router.patch('/:id/tasks/:taskId', async (req: AuthRequest, res: Response) => {
  try {
    const goal = await GoalStore.findById(req.params.id);
    if (!goal || goal.userId !== req.userId) {
      return res.status(404).json({ error: 'Goal not found.' });
    }

    const { completed, title, dueDate } = req.body;
    const taskList = [...(goal.tasks || [])];
    const taskIndex = taskList.findIndex((t: any) => t.id === req.params.taskId);

    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found in this goal.' });
    }

    if (completed !== undefined) taskList[taskIndex].completed = !!completed;
    if (title !== undefined) taskList[taskIndex].title = title.trim();
    if (dueDate !== undefined) taskList[taskIndex].dueDate = dueDate;

    const progress = computeProgress(taskList);
    let status = goal.status;
    if (progress === 100 && status !== 'Archived') {
      status = 'Completed';
    } else if (progress < 100 && status === 'Completed') {
      status = 'Active';
    }

    const updated = await GoalStore.findByIdAndUpdate(req.params.id, {
      tasks: taskList,
      progress,
      status,
    });

    return res.json({ message: 'Task updated.', goal: updated });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update task.' });
  }
});

// Add new task to goal
router.post('/:id/tasks', async (req: AuthRequest, res: Response) => {
  try {
    const goal = await GoalStore.findById(req.params.id);
    if (!goal || goal.userId !== req.userId) {
      return res.status(404).json({ error: 'Goal not found.' });
    }

    const { title, dueDate } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Task title is required.' });
    }

    const newTask = {
      id: 'task_' + Math.random().toString(36).substring(2, 9),
      title: title.trim(),
      completed: false,
      dueDate: dueDate || '',
    };

    const taskList = [...(goal.tasks || []), newTask];
    const progress = computeProgress(taskList);
    const updated = await GoalStore.findByIdAndUpdate(req.params.id, {
      tasks: taskList,
      progress,
      status: progress === 100 ? 'Completed' : 'Active',
    });

    return res.status(201).json({ message: 'Task added.', goal: updated, task: newTask });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to add task.' });
  }
});

// Delete task from goal
router.delete('/:id/tasks/:taskId', async (req: AuthRequest, res: Response) => {
  try {
    const goal = await GoalStore.findById(req.params.id);
    if (!goal || goal.userId !== req.userId) {
      return res.status(404).json({ error: 'Goal not found.' });
    }

    const taskList = (goal.tasks || []).filter((t: any) => t.id !== req.params.taskId);
    const progress = computeProgress(taskList);
    const updated = await GoalStore.findByIdAndUpdate(req.params.id, {
      tasks: taskList,
      progress,
    });

    return res.json({ message: 'Task removed.', goal: updated });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to remove task.' });
  }
});

// Delete goal
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await GoalStore.findById(req.params.id);
    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({ error: 'Goal not found.' });
    }

    await GoalStore.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Goal deleted successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete goal.' });
  }
});

export default router;
