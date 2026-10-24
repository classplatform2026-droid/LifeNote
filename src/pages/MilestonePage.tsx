import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.ts';
import { Goal, GoalTask, AILanguage } from '../types/index.ts';
import { AIApprovalModal } from '../components/AIApprovalModal.tsx';
import {
  Target,
  Plus,
  Trash2,
  Edit3,
  Sparkles,
  CheckCircle2,
  Circle,
  Calendar,
  X,
  RefreshCw,
  Clock,
  Check,
  Search,
  ChevronDown,
  ChevronUp,
  Globe,
  SlidersHorizontal,
} from 'lucide-react';

export const MilestonePage: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('priority');
  const [search, setSearch] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Dropdown collapsible task checklist per goal
  const [expandedGoals, setExpandedGoals] = useState<Record<string, boolean>>({});

  // Create / Edit Goal Modal
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Form State
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('Career');
  const [priority, setPriority] = useState<Goal['priority']>('Medium');
  const [deadline, setDeadline] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Inline new task input for a goal
  const [activeGoalAddingTask, setActiveGoalAddingTask] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>('');

  // AI Task Plan Generator
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiApprovalOpen, setAiApprovalOpen] = useState<boolean>(false);
  const [aiLanguage, setAiLanguage] = useState<AILanguage>('unique');
  const [activeGoalForAI, setActiveGoalForAI] = useState<Goal | null>(null);
  const [aiPlannedTasks, setAiPlannedTasks] = useState<{
    strategicSummary: string;
    suggestedTasks: Array<{ title: string; dueDate?: string }>;
  } | null>(null);
  const [wasAIAppliedGoalId, setWasAIAppliedGoalId] = useState<string | null>(null);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await api.getGoals({
        category: categoryFilter,
        priority: priorityFilter,
        status: statusFilter,
        search,
        sortBy,
      });
      setGoals(res.goals || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load milestones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [categoryFilter, priorityFilter, statusFilter, search, sortBy]);

  const handleOpenCreate = () => {
    setEditingGoal(null);
    setTitle('');
    setDescription('');
    setCategory('Career');
    setPriority('Medium');
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    setDeadline(defaultDate.toISOString().split('T')[0]);
    setModalOpen(true);
  };

  const handleOpenEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setDescription(goal.description || '');
    setCategory(goal.category || 'Career');
    setPriority(goal.priority || 'Medium');
    setDeadline(goal.deadline || '');
    setModalOpen(true);
  };

  const handleSaveGoal = async () => {
    if (!title.trim()) {
      setErrorMessage('Goal title is required.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage('');
      if (editingGoal) {
        const res = await api.updateGoal(editingGoal._id, {
          title,
          description,
          category,
          priority,
          deadline,
        });
        setGoals(goals.map((g) => (g._id === res.goal._id ? res.goal : g)));
      } else {
        const res = await api.createGoal({
          title,
          description,
          category,
          priority,
          deadline,
          tasks: [],
        });
        setGoals([res.goal, ...goals]);
      }
      setModalOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save goal.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this goal and its tasks?')) return;
    try {
      await api.deleteGoal(id);
      setGoals(goals.filter((g) => g._id !== id));
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete goal.');
    }
  };

  // Toggle Task Completion
  const handleToggleTask = async (goalId: string, task: GoalTask) => {
    try {
      const res = await api.updateTask(goalId, task.id, {
        completed: !task.completed,
      });
      setGoals(goals.map((g) => (g._id === goalId ? res.goal : g)));
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update task.');
    }
  };

  // Add Task to Goal
  const handleAddTask = async (goalId: string) => {
    if (!newTaskTitle.trim()) return;
    try {
      const res = await api.addTask(goalId, {
        title: newTaskTitle.trim(),
        dueDate: newTaskDueDate || '',
      });
      setGoals(goals.map((g) => (g._id === goalId ? res.goal : g)));
      setNewTaskTitle('');
      setNewTaskDueDate('');
      setActiveGoalAddingTask(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to add task.');
    }
  };

  // Remove Task from Goal
  const handleDeleteTask = async (goalId: string, taskId: string) => {
    try {
      const res = await api.deleteTask(goalId, taskId);
      setGoals(goals.map((g) => (g._id === goalId ? res.goal : g)));
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete task.');
    }
  };

  // Update Goal Status directly via Dropdown
  const handleUpdateGoalStatus = async (goalId: string, newStatus: Goal['status']) => {
    try {
      const res = await api.updateGoal(goalId, { status: newStatus });
      setGoals(goals.map((g) => (g._id === goalId ? res.goal : g)));
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update goal status.');
    }
  };

  // Update Goal Priority directly via Dropdown
  const handleUpdateGoalPriority = async (goalId: string, newPriority: Goal['priority']) => {
    try {
      const res = await api.updateGoal(goalId, { priority: newPriority });
      setGoals(goals.map((g) => (g._id === goalId ? res.goal : g)));
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update goal priority.');
    }
  };

  // Toggle tasks accordion dropdown
  const toggleGoalExpanded = (goalId: string) => {
    setExpandedGoals((prev) => {
      const isCurrentlyExpanded = prev[goalId] !== false;
      return {
        ...prev,
        [goalId]: !isCurrentlyExpanded,
      };
    });
  };

  // AI Task Planning Request
  const handleRequestAIPlan = async (goal: Goal) => {
    try {
      setActiveGoalForAI(goal);
      setAiLoading(true);
      setErrorMessage('');
      const res = await api.generateGoalPlan({
        title: goal.title,
        description: goal.description,
        category: goal.category,
        deadline: goal.deadline,
        currentTasks: goal.tasks,
        language: aiLanguage,
      });

      setAiPlannedTasks(res);
      setAiApprovalOpen(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'AI task planning failed.');
    } finally {
      setAiLoading(false);
    }
  };

  // Approve and save AI planned tasks to MongoDB
  const handleApproveAIPlan = async () => {
    if (!activeGoalForAI || !aiPlannedTasks) return;
    try {
      setIsSaving(true);
      const newTasksToAdd = aiPlannedTasks.suggestedTasks;

      // Atomically add all suggested tasks to the goal in a single atomic request
      const combinedTasks = [
        ...(activeGoalForAI.tasks || []),
        ...newTasksToAdd.map((t) => ({
          title: t.title,
          completed: false,
          dueDate: t.dueDate || activeGoalForAI.deadline || '',
        })),
      ];

      const res = await api.updateGoal(activeGoalForAI._id, { tasks: combinedTasks });
      const updatedGoal = res.goal;
      setGoals(goals.map((g) => (g._id === updatedGoal._id ? updatedGoal : g)));
      setAiApprovalOpen(false);
      setAiPlannedTasks(null);
      setWasAIAppliedGoalId(activeGoalForAI._id);
      setTimeout(() => setWasAIAppliedGoalId(null), 2500);
      setActiveGoalForAI(null);
    } catch (err: any) {
      setErrorMessage('Failed to apply AI task plan.');
    } finally {
      setIsSaving(false);
    }
  };

  const priorityBadgeStyle: Record<string, string> = {
    High: 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-950/60 font-semibold',
    Medium: 'text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-950/60',
    Low: 'text-neutral-600 bg-neutral-100 dark:text-neutral-400 dark:bg-neutral-800',
  };

  return (
    <div className="min-h-full pb-20 pt-4 px-3 md:px-6 max-w-7xl mx-auto">
      {/* Compact Editorial Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl md:text-2xl font-serif font-bold text-neutral-900 dark:text-white tracking-tight">
            Milestones & Goals
          </h1>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
            {goals.length} goals
          </span>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg text-xs font-medium shadow-xs hover:opacity-90 transition-all shrink-0 active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Goal</span>
        </button>
      </div>

      {errorMessage && (
        <div className="mt-2.5 p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-800 dark:text-red-300 flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Single Compact Flex Filter Bar with Dropdowns for Goals Section */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5 bg-neutral-50 dark:bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search goals or tasks..."
            className="w-full pl-8 pr-2.5 py-1 text-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-neutral-500"
          />
        </div>

        {/* Dropdowns Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1">
            <span className="text-neutral-500 text-[11px] font-medium hidden sm:inline">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2 py-1 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Career">Career</option>
              <option value="Creative">Creative</option>
              <option value="Health">Health</option>
              <option value="Financial">Financial</option>
              <option value="Personal">Personal</option>
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-1">
            <span className="text-neutral-500 text-[11px] font-medium hidden sm:inline">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2 py-1 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Priority Dropdown */}
          <div className="flex items-center gap-1">
            <span className="text-neutral-500 text-[11px] font-medium hidden sm:inline">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2 py-1 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none cursor-pointer"
            >
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1">
            <span className="text-neutral-500 text-[11px] font-medium hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2 py-1 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none cursor-pointer"
            >
              <option value="priority">Priority</option>
              <option value="deadline">Deadline</option>
              <option value="progress">Progress</option>
              <option value="newest">Newest</option>
            </select>
          </div>

          {/* Language Selection Dropdown */}
          <div className="flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <select
              value={aiLanguage}
              onChange={(e) => setAiLanguage(e.target.value as AILanguage)}
              className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2 py-1 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none cursor-pointer"
              title="AI Planning Language"
            >
              <option value="unique">Language: Auto / Unique</option>
              <option value="bn">বাংলা (Bengali)</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* Expand / Collapse All Dropdown Toggle */}
          {goals.length > 0 && (
            <button
              onClick={() => {
                const areAnyCollapsed = goals.some((g) => expandedGoals[g._id] === false);
                const newState: Record<string, boolean> = {};
                goals.forEach((g) => {
                  newState[g._id] = areAnyCollapsed;
                });
                setExpandedGoals(newState);
              }}
              className="px-2 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-xs flex items-center gap-1 transition-colors"
              title="Expand or collapse all goal task dropdowns"
            >
              <ChevronDown className="w-3 h-3" />
              <span>Toggle Tasks</span>
            </button>
          )}
        </div>
      </div>

      {/* Goals Compact Flex Grid/List */}
      <div className="mt-4 space-y-3">
        {loading ? (
          <div className="space-y-2.5">
            {[1, 2].map((i) => (
              <div key={i} className="h-28 bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : goals.length === 0 ? (
          <div className="py-14 text-center border border-dashed border-neutral-300 dark:border-neutral-800 rounded-xl">
            <Target className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
              No milestones defined yet
            </h3>
            <p className="text-xs text-neutral-500 mt-1 mb-3">
              Formulate your first life goal and let AI suggest actionable milestones.
            </p>
            <button
              onClick={handleOpenCreate}
              className="px-3.5 py-1.5 text-xs font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg"
            >
              Create Goal
            </button>
          </div>
        ) : (
          goals.map((goal) => {
            const completedCount = goal.tasks.filter((t) => t.completed).length;
            const totalCount = goal.tasks.length;
            const isAIWorking = activeGoalForAI?._id === goal._id && aiLoading;
            const wasJustApplied = wasAIAppliedGoalId === goal._id;
            const isExpanded = expandedGoals[goal._id] !== false;

            return (
              <div
                key={goal._id}
                className={`bg-white dark:bg-neutral-900 border rounded-xl p-3.5 shadow-xs transition-all relative overflow-hidden ${
                  isAIWorking
                    ? 'animate-ai-glow border-amber-500/80 ring-2 ring-amber-500/30'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                } ${wasJustApplied ? 'animate-ai-applied' : ''}`}
              >
                {/* AI Scanning Beam */}
                {isAIWorking && (
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_16px_rgba(251,191,36,1)] pointer-events-none z-20 animate-ai-scan" />
                )}

                {/* Compact Header Flex Strip with Dropdowns */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                    <span className="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                      {goal.category}
                    </span>

                    {/* Priority Dropdown on Goal */}
                    <select
                      value={goal.priority}
                      onChange={(e) => handleUpdateGoalPriority(goal._id, e.target.value as any)}
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-700 cursor-pointer focus:outline-none ${
                        priorityBadgeStyle[goal.priority] || ''
                      }`}
                      title="Change Goal Priority (Dropdown)"
                    >
                      <option value="High">High Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="Low">Low Priority</option>
                    </select>

                    {/* Status Dropdown on Goal */}
                    <select
                      value={goal.status || 'Active'}
                      onChange={(e) => handleUpdateGoalStatus(goal._id, e.target.value as any)}
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded border focus:outline-none cursor-pointer ${
                        goal.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 font-semibold'
                          : 'bg-neutral-100 text-neutral-800 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700'
                      }`}
                      title="Change Goal Status (Dropdown)"
                    >
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                    </select>

                    {goal.deadline && (
                      <span className="flex items-center gap-1 text-[11px] text-neutral-500 font-mono">
                        <Clock className="w-3 h-3 text-neutral-400" />
                        <span>{goal.deadline}</span>
                      </span>
                    )}

                    <h3 className="text-sm font-serif font-bold text-neutral-900 dark:text-white truncate ml-1">
                      {goal.title}
                    </h3>
                  </div>

                  {/* Actions & AI Planning Button & Task Dropdown Toggle */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Progress percentage pill */}
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white">
                      {goal.progress}% ({completedCount}/{totalCount})
                    </span>

                    {/* Tasks Collapsible Dropdown Toggle */}
                    <button
                      onClick={() => toggleGoalExpanded(goal._id)}
                      className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors"
                      title={isExpanded ? 'Collapse Tasks' : 'Expand Tasks (Dropdown)'}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-neutral-500" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                      )}
                      <span>Tasks ({completedCount}/{totalCount})</span>
                    </button>

                    <button
                      onClick={() => handleRequestAIPlan(goal)}
                      disabled={aiLoading}
                      className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                        isAIWorking
                          ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 animate-pulse'
                          : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white'
                      }`}
                      title="Generate actionable task checklist with AI"
                    >
                      {isAIWorking ? (
                        <RefreshCw className="w-3 h-3 animate-spin text-amber-600 dark:text-amber-400" />
                      ) : (
                        <Sparkles className="w-3 h-3 text-amber-500" />
                      )}
                      <span>{isAIWorking ? 'Planning...' : 'AI Plan'}</span>
                    </button>

                    <button
                      onClick={() => handleOpenEdit(goal)}
                      className="p-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded"
                      title="Edit Goal"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal._id)}
                      className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded"
                      title="Delete Goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar (Thin line) */}
                <div className="w-full h-1 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden mt-1.5">
                  <div
                    className="h-full bg-neutral-900 dark:bg-white rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>

                {goal.description && (
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-1.5 line-clamp-2">
                    {goal.description}
                  </p>
                )}

                {/* Collapsible Action Tasks Section via Dropdown */}
                {isExpanded ? (
                  <div className="mt-2.5 space-y-1 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-500 pb-0.5">
                      <div className="flex items-center gap-1.5">
                        <ChevronDown className="w-3 h-3 text-neutral-400" />
                        <span>Action Tasks & Milestones</span>
                      </div>
                      <button
                        onClick={() =>
                          setActiveGoalAddingTask(
                            activeGoalAddingTask === goal._id ? null : goal._id
                          )
                        }
                        className="flex items-center gap-1 text-neutral-800 dark:text-neutral-200 hover:underline text-[11px]"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Task</span>
                      </button>
                    </div>

                    {/* Inline Add Task Flex Row */}
                    {activeGoalAddingTask === goal._id && (
                      <div className="flex items-center gap-1.5 p-1.5 bg-neutral-50 dark:bg-neutral-800/80 rounded-lg border border-neutral-200 dark:border-neutral-700 animate-in fade-in duration-150">
                        <input
                          type="text"
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddTask(goal._id)}
                          placeholder="Task title (e.g. Complete chapter draft)..."
                          className="flex-1 px-2 py-1 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded focus:outline-none"
                          autoFocus
                        />
                        <input
                          type="date"
                          value={newTaskDueDate}
                          onChange={(e) => setNewTaskDueDate(e.target.value)}
                          className="px-1.5 py-1 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded text-neutral-600 dark:text-neutral-300 w-28 shrink-0 cursor-pointer"
                        />
                        <button
                          onClick={() => handleAddTask(goal._id)}
                          className="px-2.5 py-1 text-xs font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded hover:opacity-90 shrink-0"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setActiveGoalAddingTask(null)}
                          className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Tasks List */}
                    {goal.tasks.length === 0 ? (
                      <p className="text-[11px] text-neutral-400 italic py-0.5">
                        No tasks yet. Click "AI Plan" to suggest steps or "+ Add Task".
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {goal.tasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center justify-between gap-2 py-1 px-2 rounded-md bg-neutral-50 dark:bg-neutral-800/40 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors text-xs group"
                          >
                            <div
                              onClick={() => handleToggleTask(goal._id, task)}
                              className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                            >
                              {task.completed ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-neutral-900 dark:text-white shrink-0" />
                              ) : (
                                <Circle className="w-3.5 h-3.5 text-neutral-400 shrink-0 group-hover:text-neutral-600" />
                              )}
                              <span
                                className={`truncate text-xs ${
                                  task.completed
                                    ? 'line-through text-neutral-400 dark:text-neutral-500'
                                    : 'text-neutral-800 dark:text-neutral-200'
                                }`}
                              >
                                {task.title}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {task.dueDate && (
                                <span className="text-[10px] font-mono text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.2 rounded">
                                  {task.dueDate}
                                </span>
                              )}
                              <button
                                onClick={() => handleDeleteTask(goal._id, task.id)}
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-neutral-400 hover:text-red-600 transition-opacity"
                                title="Delete task"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Collapsed Dropdown preview */
                  <div
                    onClick={() => toggleGoalExpanded(goal._id)}
                    className="mt-2 py-1.5 px-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-dashed border-neutral-200 dark:border-neutral-800 flex items-center justify-between cursor-pointer text-[11px] text-neutral-500 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <ChevronDown className="w-3 h-3 text-neutral-400" />
                      <span>{totalCount} task{totalCount === 1 ? '' : 's'} ({completedCount} completed)</span>
                    </span>
                    <span className="text-[10px] font-medium text-neutral-700 dark:text-neutral-300">Click dropdown to expand tasks</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Goal Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl p-4 md:p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800 mb-3">
              <h3 className="text-base font-serif font-bold text-neutral-900 dark:text-white">
                {editingGoal ? 'Edit Milestone Goal' : 'Define New Goal'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Goal Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Master Deep Work & Publish Essay Series"
                  className="w-full px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-neutral-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Description & Context
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Why does this matter? What is the core deliverable?"
                  className="w-full px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-neutral-500 text-xs"
                />
              </div>

              {/* Compact flex row for Category, Priority, Deadline */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-2 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none text-xs"
                  >
                    <option value="Career">Career</option>
                    <option value="Creative">Creative</option>
                    <option value="Health">Health</option>
                    <option value="Financial">Financial</option>
                    <option value="Personal">Personal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-2 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none text-xs"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Target Deadline
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-2 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 mt-3 border-t border-neutral-200 dark:border-neutral-800">
              <button
                onClick={() => setModalOpen(false)}
                className="px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGoal}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg text-xs font-medium hover:opacity-90"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>{editingGoal ? 'Update Goal' : 'Create Goal'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Task Plan Approval Modal */}
      {aiPlannedTasks && activeGoalForAI && (
        <AIApprovalModal
          isOpen={aiApprovalOpen}
          title={`AI Task Plan for "${activeGoalForAI.title}"`}
          summary={aiPlannedTasks.strategicSummary}
          originalContent={`<p><strong>Current Tasks:</strong></p><ul>${
            activeGoalForAI.tasks.map((t) => `<li>${t.title}</li>`).join('') || '<li>None</li>'
          }</ul>`}
          suggestedContent={`<p><strong>AI Suggested Milestones:</strong></p><ul>${aiPlannedTasks.suggestedTasks
            .map((t) => `<li><strong>${t.title}</strong> ${t.dueDate ? `<em>(Due: ${t.dueDate})</em>` : ''}</li>`)
            .join('')}</ul>`}
          onApprove={handleApproveAIPlan}
          onReject={() => {
            setAiApprovalOpen(false);
            setAiPlannedTasks(null);
            setActiveGoalForAI(null);
          }}
          isSaving={isSaving}
        />
      )}
    </div>
  );
};
