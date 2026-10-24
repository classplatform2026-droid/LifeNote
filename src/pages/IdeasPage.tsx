import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.ts';
import { Idea, AILanguage } from '../types/index.ts';
import { AIApprovalModal } from '../components/AIApprovalModal.tsx';
import { AIPolishModal, AIPolishPreset } from '../components/AIPolishModal.tsx';
import {
  Lightbulb,
  Plus,
  Search,
  Trash2,
  Edit3,
  Sparkles,
  Check,
  X,
  RefreshCw,
  Tag,
  ArrowRight,
  ArrowLeft,
  Globe,
} from 'lucide-react';

const IDEA_PRESETS: AIPolishPreset[] = [
  { id: 'structure', label: 'Clarify & Structure', description: 'Organize core vision and concept' },
  { id: 'actionable', label: 'Action Steps & Pillars', description: 'Concrete roadmap and next milestones' },
  { id: 'expand', label: 'Expand & Elaborate', description: 'Nuanced context and strategic angles' },
  { id: 'executive', label: 'Executive Pitch', description: 'Punchy, high-impact synopsis' },
];

export const IdeasPage: React.FC = () => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Selected Idea for dedicated separate view
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);

  // Modal create/edit
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [polishModalOpen, setPolishModalOpen] = useState<boolean>(false);

  // Form states
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('Creative');
  const [status, setStatus] = useState<Idea['status']>('Draft');
  const [tagsInput, setTagsInput] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // AI Development Modal
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiApprovalOpen, setAiApprovalOpen] = useState<boolean>(false);
  const [aiLanguage, setAiLanguage] = useState<AILanguage>('unique');
  const [activeIdeaForAI, setActiveIdeaForAI] = useState<Idea | null>(null);
  const [aiDevelopedData, setAiDevelopedData] = useState<{
    clarifiedTitle: string;
    organizedSummary: string;
    corePillars: string[];
    actionSteps: string[];
    suggestedNotes: string;
  } | null>(null);
  const [wasAIAppliedIdeaId, setWasAIAppliedIdeaId] = useState<string | null>(null);

  const fetchIdeas = async () => {
    try {
      setLoading(true);
      const res = await api.getIdeas({
        category: categoryFilter,
        status: statusFilter,
        search,
      });
      setIdeas(res.ideas || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load ideas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Concepts & Ideas | LifeNote AI';
  }, []);

  useEffect(() => {
    fetchIdeas();
  }, [categoryFilter, statusFilter, search]);

  const handleOpenCreate = () => {
    setEditingIdea(null);
    setTitle('');
    setDescription('');
    setCategory('Creative');
    setStatus('Draft');
    setTagsInput('');
    setNotes('');
    setErrorMessage('');
    setModalOpen(true);
  };

  const handleOpenEdit = (idea: Idea) => {
    setEditingIdea(idea);
    setTitle(idea.title);
    setDescription(idea.description);
    setCategory(idea.category || 'Creative');
    setStatus(idea.status || 'Draft');
    setTagsInput(idea.tags ? idea.tags.join(', ') : '');
    setNotes(idea.notes || '');
    setErrorMessage('');
    setModalOpen(true);
  };

  const handleSaveIdea = async () => {
    if (!title.trim() || !description.trim()) {
      setErrorMessage('Title and description are required.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage('');
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      if (editingIdea) {
        const res = await api.updateIdea(editingIdea._id, {
          title,
          description,
          category,
          status,
          tags,
          notes,
        });
        setIdeas(ideas.map((i) => (i._id === res.idea._id ? res.idea : i)));
        if (selectedIdea && selectedIdea._id === res.idea._id) {
          setSelectedIdea(res.idea);
        }
      } else {
        const res = await api.createIdea({
          title,
          description,
          category,
          status,
          tags,
          notes,
        });
        setIdeas([res.idea, ...ideas]);
        setSelectedIdea(res.idea);
      }
      setModalOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save idea');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteIdea = async (id: string) => {
    if (!confirm('Are you sure you want to delete this idea?')) return;
    try {
      await api.deleteIdea(id);
      setIdeas(ideas.filter((i) => i._id !== id));
      if (selectedIdea?._id === id) {
        setSelectedIdea(null);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete idea');
    }
  };

  // AI Idea Polish / Development Flow via Modal
  const handleApplyAIPolish = async (data: { preset: string; customCommand: string; language: AILanguage }) => {
    const titleToUse = title.trim() || editingIdea?.title || 'Untitled Concept';
    const descToUse = description.trim() || editingIdea?.description || '';

    if (!titleToUse && !descToUse) {
      setErrorMessage('Please provide at least a title or description for the idea.');
      return;
    }

    try {
      setAiLoading(true);
      setErrorMessage('');
      const res = await api.developIdea({
        title: titleToUse,
        description: descToUse,
        notes,
        category,
        language: data.language,
        customCommand: data.customCommand,
      });

      setPolishModalOpen(false);
      setAiDevelopedData(res);
      setAiApprovalOpen(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to polish idea with AI');
    } finally {
      setAiLoading(false);
    }
  };

  const handleApproveAIDevelopment = async () => {
    if (!aiDevelopedData) return;
    try {
      setIsSaving(true);
      const updatedNotes = `${notes ? `${notes}\n\n` : ''}--- AI POLISH ---\n${aiDevelopedData.suggestedNotes}\n\nCore Pillars:\n${aiDevelopedData.corePillars.map((p) => `- ${p}`).join('\n')}\n\nAction Steps:\n${aiDevelopedData.actionSteps.map((s) => `- ${s}`).join('\n')}`;

      // Update active editor form inputs in modal
      setTitle(aiDevelopedData.clarifiedTitle);
      setDescription(aiDevelopedData.organizedSummary);
      setNotes(updatedNotes);
      setStatus('In Progress');

      if (editingIdea) {
        const res = await api.updateIdea(editingIdea._id, {
          title: aiDevelopedData.clarifiedTitle,
          description: aiDevelopedData.organizedSummary,
          notes: updatedNotes,
          status: 'In Progress',
          category,
        });
        setIdeas(ideas.map((i) => (i._id === res.idea._id ? res.idea : i)));
        if (selectedIdea && selectedIdea._id === res.idea._id) {
          setSelectedIdea(res.idea);
        }
        setWasAIAppliedIdeaId(editingIdea._id);
        setTimeout(() => setWasAIAppliedIdeaId(null), 2500);
      }

      setAiApprovalOpen(false);
      setAiDevelopedData(null);
      setActiveIdeaForAI(null);
    } catch (err: any) {
      setErrorMessage('Failed to apply AI changes to idea.');
    } finally {
      setIsSaving(false);
    }
  };

  const categories = ['All', 'Creative', 'Business', 'Writing', 'Life', 'Technical'];
  const statuses: Array<Idea['status'] | 'All'> = ['All', 'Draft', 'In Progress', 'Completed'];

  const statusStyles: Record<string, string> = {
    Draft: 'text-neutral-500 bg-neutral-100 dark:bg-neutral-800',
    'In Progress': 'text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-950/60 font-semibold',
    Completed: 'text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950/60 font-semibold',
  };

  return (
    <div className="min-h-full pb-20 pt-4 px-3 md:px-6 max-w-7xl mx-auto">
      {/* Compact Editorial Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl md:text-2xl font-serif font-bold text-neutral-900 dark:text-white tracking-tight">
            Idea Incubator
          </h1>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
            {ideas.length} concepts
          </span>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg text-xs font-medium shadow-xs hover:opacity-90 transition-all shrink-0 active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Idea</span>
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

      {/* Main Content: Ideas Grid vs Dedicated Idea View */}
      {!selectedIdea ? (
        /* Ideas Incubator Grid View */
        <>
          {/* Single Compact Flex Filter Bar */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 bg-neutral-50 dark:bg-neutral-900/60 p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs">
            {/* Search */}
            <div className="relative flex-1 min-w-[150px]">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search concepts, tags, or notes..."
                className="w-full pl-8 pr-2.5 py-1 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:border-neutral-500"
              />
            </div>

            {/* Status flex buttons */}
            <div className="flex items-center gap-1">
              <span className="text-neutral-500 text-[11px] mr-1">Status:</span>
              {statuses.map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2 py-0.5 rounded transition-colors text-xs ${
                    statusFilter === st
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-medium'
                      : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Category dropdown */}
            <div className="flex items-center gap-1">
              <span className="text-neutral-500 text-[11px] mr-1">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2 py-1 text-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ideas Grid */}
          <div className="mt-4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : ideas.length === 0 ? (
              <div className="py-14 text-center border border-dashed border-neutral-300 dark:border-neutral-800 rounded-xl">
                <Lightbulb className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  No ideas in this view
                </h3>
                <p className="text-xs text-neutral-500 mt-1 mb-3">
                  Spark your first creative concept or adjust your filter.
                </p>
                <button
                  onClick={handleOpenCreate}
                  className="px-3.5 py-1.5 text-xs font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg"
                >
                  New Idea
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {ideas.map((idea) => {
                  const isAIWorking = activeIdeaForAI?._id === idea._id && aiLoading;
                  const wasJustApplied = wasAIAppliedIdeaId === idea._id;

                  return (
                    <div
                      key={idea._id}
                      onClick={() => setSelectedIdea(idea)}
                      role="button"
                      tabIndex={0}
                      className={`bg-white dark:bg-neutral-900 border rounded-xl p-3.5 flex flex-col justify-between shadow-xs transition-all relative overflow-hidden group cursor-pointer hover:shadow-sm ${
                        isAIWorking
                          ? 'animate-ai-glow border-amber-500/80 ring-2 ring-amber-500/30'
                          : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-700'
                      } ${wasJustApplied ? 'animate-ai-applied' : ''}`}
                    >
                      {/* AI Scanning Beam */}
                      {isAIWorking && (
                        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_16px_rgba(251,191,36,1)] pointer-events-none z-20 animate-ai-scan" />
                      )}

                      <div>
                        {/* Top metadata row */}
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-mono text-neutral-500 text-[10px] uppercase tracking-wider">
                            {idea.category}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                              statusStyles[idea.status] || statusStyles.Draft
                            }`}
                          >
                            {idea.status}
                          </span>
                        </div>

                        <h3 className="text-xs md:text-sm font-semibold text-neutral-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                          {idea.title}
                        </h3>

                        <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                          {idea.description}
                        </p>

                        {idea.notes && (
                          <div className="mt-2 p-1.5 bg-neutral-50 dark:bg-neutral-800/50 rounded text-[10px] text-neutral-500 font-mono line-clamp-1">
                            {idea.notes.replace(/#/g, '')}
                          </div>
                        )}

                        {idea.tags && idea.tags.length > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-neutral-400 mt-2">
                            <Tag className="w-2.5 h-2.5" />
                            <span>{idea.tags.join(' · ')}</span>
                          </div>
                        )}
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-neutral-100 dark:border-neutral-800/80 text-xs">
                        <span className="text-[11px] text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300">
                          View Concept
                        </span>

                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(idea);
                            }}
                            className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded"
                            title="Edit Idea"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteIdea(idea._id);
                            }}
                            className="p-1 text-neutral-400 hover:text-red-600 rounded"
                            title="Delete Idea"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Dedicated Full-Width View of Selected Idea */
        <div className="mt-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 md:p-6 shadow-xs max-w-4xl mx-auto">
          {/* Header Navigation with Back Button */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-200 dark:border-neutral-800 mb-4">
            <button
              onClick={() => setSelectedIdea(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-all shadow-2xs active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
              <span>Back to Ideas</span>
            </button>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleOpenEdit(selectedIdea)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                title="Edit Idea"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => handleDeleteIdea(selectedIdea._id)}
                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                title="Delete Idea"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Full Idea Content Canvas */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                {selectedIdea.category}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${statusStyles[selectedIdea.status] || statusStyles.Draft}`}>
                {selectedIdea.status}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-serif font-bold text-neutral-900 dark:text-white leading-tight">
              {selectedIdea.title}
            </h1>

            <div className="bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/70 dark:border-neutral-800 rounded-xl p-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1.5">Concept Statement</h3>
              <p className="text-sm md:text-base text-neutral-800 dark:text-neutral-200 leading-relaxed font-serif">
                {selectedIdea.description}
              </p>
            </div>

            {selectedIdea.notes && (
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 space-y-2">
                <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400">Structured Notes & Strategy</h3>
                <div className="text-xs md:text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap font-sans leading-relaxed">
                  {selectedIdea.notes}
                </div>
              </div>
            )}

            {selectedIdea.tags && selectedIdea.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                {selectedIdea.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 font-mono"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Idea Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl p-4 md:p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800 mb-3">
              <h3 className="text-base font-serif font-bold text-neutral-900 dark:text-white">
                {editingIdea ? 'Edit Concept' : 'Capture New Idea'}
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
                  Concept Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Asynchronous Micro-Publishing Protocol"
                  className="w-full px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-neutral-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Core Premise & Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="What is the insight, problem, or vision?"
                  className="w-full px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-neutral-500 text-xs"
                />
              </div>

              {/* Compact flex row for Category and Status */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-2 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none text-xs"
                  >
                    <option value="Creative">Creative</option>
                    <option value="Business">Business</option>
                    <option value="Writing">Writing</option>
                    <option value="Life">Life</option>
                    <option value="Technical">Technical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-2 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none text-xs"
                  >
                    <option value="Draft">Draft</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Working Notes & Angles
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Additional context, references, open questions..."
                  className="w-full px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-neutral-500 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Tags (Comma separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. essay, architecture, mvp"
                  className="w-full px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-neutral-500 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-4 mt-3 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setPolishModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-lg text-xs font-medium border border-neutral-200 dark:border-neutral-700 transition-colors shadow-2xs"
                title="Polish this idea with AI"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>AI Polish</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveIdea}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg text-xs font-medium hover:opacity-90"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{editingIdea ? 'Save Changes' : 'Record Idea'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Idea Development Approval Modal */}
      {aiDevelopedData && (
        <AIApprovalModal
          isOpen={aiApprovalOpen}
          title={`AI Strategy for "${title || 'Idea Concept'}"`}
          summary={aiDevelopedData.organizedSummary}
          originalContent={`<p><strong>Original Title:</strong> ${title || 'Draft'}</p><p><strong>Description:</strong> ${description}</p>${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}`}
          suggestedContent={`<p><strong>Clarified Title:</strong> ${aiDevelopedData.clarifiedTitle}</p><p><strong>Executive Summary:</strong> ${aiDevelopedData.organizedSummary}</p><p><strong>Core Pillars:</strong></p><ul>${aiDevelopedData.corePillars.map((p) => `<li>${p}</li>`).join('')}</ul><p><strong>Action Steps:</strong></p><ul>${aiDevelopedData.actionSteps.map((s) => `<li>${s}</li>`).join('')}</ul>`}
          onApprove={handleApproveAIDevelopment}
          onReject={() => {
            setAiApprovalOpen(false);
            setAiDevelopedData(null);
            setActiveIdeaForAI(null);
          }}
          isSaving={isSaving}
        />
      )}

      {/* AI Polish Options & Custom Command Modal */}
      <AIPolishModal
        isOpen={polishModalOpen}
        onClose={() => setPolishModalOpen(false)}
        onApply={handleApplyAIPolish}
        isLoading={aiLoading}
        title="AI Polish Idea"
        presets={IDEA_PRESETS}
        initialLanguage={aiLanguage}
        error={errorMessage}
      />
    </div>
  );
};
