import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.ts';
import { DiaryEntry, AILanguage } from '../types/index.ts';
import { RichTextEditor } from '../components/RichTextEditor.tsx';
import { AIApprovalModal } from '../components/AIApprovalModal.tsx';
import { AIPolishModal, AIPolishPreset } from '../components/AIPolishModal.tsx';
import {
  Plus,
  Search,
  Trash2,
  Edit3,
  Sparkles,
  Calendar,
  Check,
  X,
  RefreshCw,
  BookOpen,
  Globe,
  ArrowLeft,
} from 'lucide-react';

const DIARY_PRESETS: AIPolishPreset[] = [
  { id: 'reflective', label: 'Reflective & Thoughtful', description: 'Deep, emotional cadence' },
  { id: 'poetic', label: 'Poetic & Literary', description: 'Evocative phrasing & rhythm' },
  { id: 'crisp', label: 'Crisp & Clear', description: 'Direct, clear, and focused' },
  { id: 'philosophical', label: 'Philosophical', description: 'Elevated existential perspective' },
  { id: 'grammar', label: 'Grammar & Punctuation', description: 'Clean up typos and flow' },
];

export const DiaryPage: React.FC = () => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');

  // Active viewing/editing entry
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Form states
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [entryDate, setEntryDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [mood, setMood] = useState<DiaryEntry['mood']>('reflective');
  const [tagsInput, setTagsInput] = useState<string>('');
  const [coverStyle, setCoverStyle] = useState<DiaryEntry['coverStyle']>('leather');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // AI Modal States
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [polishModalOpen, setPolishModalOpen] = useState<boolean>(false);
  const [aiApprovalOpen, setAiApprovalOpen] = useState<boolean>(false);
  const [aiProposal, setAiProposal] = useState<{
    original: string;
    improved: string;
    summary: string;
    language?: AILanguage;
  } | null>(null);
  const [aiTone, setAiTone] = useState<string>('reflective');
  const [aiLanguage, setAiLanguage] = useState<AILanguage>('unique');
  const [wasAIApplied, setWasAIApplied] = useState<boolean>(false);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const res = await api.getDiaryEntries({ search, date: filterDate });
      setEntries(res.entries || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [search, filterDate]);

  const handleStartCreate = () => {
    setTitle('');
    setContent('');
    setEntryDate(new Date().toISOString().split('T')[0]);
    setMood('reflective');
    setTagsInput('');
    setCoverStyle('leather');
    setIsCreating(true);
    setIsEditing(false);
  };

  const handleStartEdit = (entry: DiaryEntry) => {
    setTitle(entry.title);
    setContent(entry.content);
    setEntryDate(entry.date);
    setMood(entry.mood || 'reflective');
    setTagsInput(entry.tags ? entry.tags.join(', ') : '');
    setCoverStyle(entry.coverStyle || 'leather');
    setIsEditing(true);
    setIsCreating(false);
  };

  const handleSaveEntry = async () => {
    if (!title.trim() || !content.trim()) {
      setErrorMessage('Please provide both a title and content.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage('');
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      if (isCreating) {
        const res = await api.createDiaryEntry({
          title,
          content,
          date: entryDate,
          mood,
          tags,
          coverStyle,
        });
        setEntries([res.entry, ...entries]);
        setSelectedEntry(res.entry);
        setIsCreating(false);
      } else if (selectedEntry) {
        const res = await api.updateDiaryEntry(selectedEntry._id, {
          title,
          content,
          date: entryDate,
          mood,
          tags,
          coverStyle,
        });
        setEntries(entries.map((e) => (e._id === res.entry._id ? res.entry : e)));
        setSelectedEntry(res.entry);
        setIsEditing(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save entry.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this diary entry?')) return;
    try {
      await api.deleteDiaryEntry(id);
      const remaining = entries.filter((e) => e._id !== id);
      setEntries(remaining);
      if (selectedEntry?._id === id) {
        setSelectedEntry(remaining[0] || null);
        setIsEditing(false);
        setIsCreating(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete entry.');
    }
  };

  // AI Improvement Flow via Modal
  const handleApplyAIPolish = async (data: { preset: string; customCommand: string; language: AILanguage }) => {
    const textToImprove = content.trim();
    if (!textToImprove) {
      setErrorMessage('Write some diary content first before requesting AI polish.');
      return;
    }

    try {
      setAiLoading(true);
      setErrorMessage('');
      const res = await api.improveDiaryEntry({
        content: textToImprove,
        tone: data.preset,
        language: data.language,
        focus: data.preset,
        customCommand: data.customCommand,
      });

      setPolishModalOpen(false);
      setAiProposal({
        original: textToImprove,
        improved: res.improvedContent,
        summary: res.changesSummary,
        language: data.language,
      });
      setAiApprovalOpen(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'AI refinement encountered an error.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleApproveAIChanges = async () => {
    if (!aiProposal) return;
    try {
      setIsSaving(true);
      setContent(aiProposal.improved);

      // If viewing an existing entry, commit directly to DB
      if (selectedEntry && !isCreating) {
        const res = await api.updateDiaryEntry(selectedEntry._id, {
          content: aiProposal.improved,
        });
        setEntries(entries.map((e) => (e._id === res.entry._id ? res.entry : e)));
        setSelectedEntry(res.entry);
      }

      setAiApprovalOpen(false);
      setAiProposal(null);
      setWasAIApplied(true);
      setTimeout(() => setWasAIApplied(false), 2500);
    } catch (err: any) {
      setErrorMessage('Failed to apply AI changes to database.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-full pb-20 pt-4 px-3 md:px-6 max-w-7xl mx-auto">
      {/* Compact Editorial Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl md:text-2xl font-serif font-bold text-neutral-900 dark:text-white tracking-tight">
            Diary & Reflections
          </h1>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
            {entries.length} entries
          </span>
        </div>

        <button
          onClick={handleStartCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg text-xs font-medium shadow-xs hover:opacity-90 transition-all shrink-0 active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Entry</span>
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

      {/* Main Container: List View vs Dedicated Entry View */}
      {!selectedEntry && !isCreating ? (
        /* List View of All Diary Entries */
        <div className="mt-3.5 space-y-3">
          {/* Filter & Search Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-neutral-50 dark:bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search entries by title, thoughts, or tags..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:border-neutral-500 transition-colors"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="py-1.5 px-2.5 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:border-neutral-500 transition-colors cursor-pointer"
              />
              {filterDate && (
                <button
                  onClick={() => setFilterDate('')}
                  className="px-2.5 py-1.5 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded-lg border border-neutral-200 dark:border-neutral-800"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Entries Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-36 bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-neutral-300 dark:border-neutral-800 rounded-xl">
              <BookOpen className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">No diary entries found</h3>
              <p className="text-xs text-neutral-500 mt-1 mb-3">Begin by writing your first reflection.</p>
              <button
                onClick={handleStartCreate}
                className="px-3.5 py-1.5 text-xs font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg"
              >
                Write Diary Entry
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {entries.map((entry) => (
                <div
                  key={entry._id}
                  onClick={() => {
                    setSelectedEntry(entry);
                    setIsCreating(false);
                    setIsEditing(false);
                  }}
                  role="button"
                  tabIndex={0}
                  className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-400 dark:hover:border-neutral-700 text-left cursor-pointer transition-all shadow-xs hover:shadow-sm group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-neutral-500 font-mono mb-1.5">
                      <span>{entry.date}</span>
                      <span className="capitalize font-sans px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-[10px]">
                        {entry.mood}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                      {entry.title}
                    </h3>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-3 mt-1.5 font-serif leading-relaxed">
                      {entry.content.replace(/<[^>]+>/g, '')}
                    </p>
                  </div>
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
                      {entry.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[10px] text-neutral-400 font-mono">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Dedicated Full-Width View for Selected Diary Entry or Editor */
        <div className="mt-3.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 md:p-6 shadow-xs max-w-4xl mx-auto">
          {/* Navigation Bar with Back Button */}
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800 mb-4">
            <button
              onClick={() => {
                setSelectedEntry(null);
                setIsCreating(false);
                setIsEditing(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-all shadow-2xs active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
              <span>Back to Entries</span>
            </button>

            {isCreating || isEditing ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPolishModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-md text-xs font-medium border border-neutral-200 dark:border-neutral-700 transition-colors shadow-2xs"
                  title="Open AI Polish popup"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>AI Polish</span>
                </button>
                <button
                  onClick={() => {
                    if (selectedEntry) {
                      setTitle(selectedEntry.title);
                      setContent(selectedEntry.content);
                      setEntryDate(selectedEntry.date);
                      setMood(selectedEntry.mood || 'reflective');
                      setTagsInput(selectedEntry.tags ? selectedEntry.tags.join(', ') : '');
                      setCoverStyle(selectedEntry.coverStyle || 'leather');
                    }
                    setIsCreating(false);
                    setIsEditing(false);
                  }}
                  className="px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 rounded-md border border-neutral-200 dark:border-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEntry}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-md text-xs font-medium hover:opacity-90 transition-opacity"
                >
                  {isSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  <span>Save Entry</span>
                </button>
              </div>
            ) : selectedEntry ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleStartEdit(selectedEntry)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white rounded-md border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  title="Edit entry"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={async () => {
                    await handleDeleteEntry(selectedEntry._id);
                    setSelectedEntry(null);
                  }}
                  className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition-colors"
                  title="Delete entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>

          {isCreating || isEditing ? (
            /* Editing/Creating Form */
            <div className="space-y-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Entry title (e.g., Observations on silence and craft)..."
                className="w-full px-1 py-1.5 text-base md:text-xl font-serif font-bold bg-transparent border-b border-neutral-200 dark:border-neutral-800 focus:outline-none focus:border-neutral-500 placeholder:text-neutral-400 transition-colors"
              />

              {/* Compact Flex Metadata & AI Control Strip */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 py-0.5 text-xs">
                {/* Left flex group: Date, Mood, Cover */}
                <div className="flex flex-wrap items-center gap-1">
                  <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded text-neutral-700 dark:text-neutral-200 border border-neutral-200/60 dark:border-neutral-700/60">
                    <Calendar className="w-3 h-3 text-neutral-400" />
                    <input
                      type="date"
                      value={entryDate}
                      onChange={(e) => setEntryDate(e.target.value)}
                      className="bg-transparent text-[11px] focus:outline-none cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded text-neutral-700 dark:text-neutral-200 border border-neutral-200/60 dark:border-neutral-700/60">
                    <span className="text-[10px] text-neutral-400">Mood:</span>
                    <select
                      value={mood}
                      onChange={(e) => setMood(e.target.value as any)}
                      className="bg-transparent text-[11px] focus:outline-none capitalize cursor-pointer"
                    >
                      <option value="reflective">Reflective</option>
                      <option value="calm">Calm</option>
                      <option value="inspired">Inspired</option>
                      <option value="grateful">Grateful</option>
                      <option value="focused">Focused</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded text-neutral-700 dark:text-neutral-200 border border-neutral-200/60 dark:border-neutral-700/60">
                    <span className="text-[10px] text-neutral-400">Cover:</span>
                    <select
                      value={coverStyle}
                      onChange={(e) => setCoverStyle(e.target.value as any)}
                      className="bg-transparent text-[11px] focus:outline-none capitalize cursor-pointer"
                    >
                      <option value="leather">Leather</option>
                      <option value="linen">Linen</option>
                      <option value="charcoal">Charcoal</option>
                      <option value="parchment">Parchment</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tiptap Rich-Text Editor */}
              <div>
                <RichTextEditor
                  content={content}
                  onChange={setContent}
                  placeholder="Record your experiences, observations, and innermost reflections..."
                  minHeight="320px"
                  isAIProcessing={aiLoading}
                  aiProcessingLabel="AI is actively refining your writing..."
                  wasAIApplied={wasAIApplied}
                />
              </div>

              {/* Tags input */}
              <div className="pt-1">
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Tags (comma separated, e.g. mindfulness, growth)..."
                  className="w-full px-2.5 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 rounded-md focus:outline-none focus:border-neutral-500"
                />
              </div>
            </div>
          ) : selectedEntry ? (
            /* Dedicated Reading View of Selected Entry */
            <div className="space-y-4">
              <div className="border-b border-neutral-100 dark:border-neutral-800/80 pb-3">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="font-mono text-xs text-neutral-500">{selectedEntry.date}</span>
                  <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[10px] text-neutral-600 dark:text-neutral-300 capitalize font-medium">
                    {selectedEntry.mood}
                  </span>
                  <span className="text-[11px] font-mono text-neutral-400">
                    {selectedEntry.wordCount || selectedEntry.content.split(/\s+/).length} words
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-neutral-900 dark:text-white leading-tight">
                  {selectedEntry.title}
                </h1>
              </div>

              {/* AI Processing Animation or Content */}
              <div
                className={`relative min-h-[220px] rounded-lg p-2 transition-all ${
                  aiLoading ? 'animate-ai-glow border border-amber-500/80 p-4' : ''
                } ${wasAIApplied ? 'animate-ai-applied' : ''}`}
              >
                {aiLoading && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xs z-10 flex flex-col items-center justify-center p-4">
                    <div className="w-10 h-10 rounded-full bg-neutral-900 text-amber-400 flex items-center justify-center mb-2 shadow-lg animate-ai-orb">
                      <Sparkles className="w-5 h-5 animate-spin" />
                    </div>
                    <div className="ai-shimmer-badge text-white px-3.5 py-1 rounded-full text-xs font-semibold">
                      AI is actively refining your diary entry...
                    </div>
                  </div>
                )}

                <div
                  className="prose prose-neutral dark:prose-invert max-w-none font-serif text-sm md:text-base leading-relaxed text-neutral-800 dark:text-neutral-200"
                  dangerouslySetInnerHTML={{ __html: selectedEntry.content }}
                />
              </div>

              {selectedEntry.tags && selectedEntry.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  {selectedEntry.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-400 font-mono"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* AI Approval Preview Modal */}
      {aiProposal && (
        <AIApprovalModal
          isOpen={aiApprovalOpen}
          title="AI Refinement Proposal"
          summary={aiProposal.summary}
          language={aiProposal.language || aiLanguage}
          originalContent={aiProposal.original}
          suggestedContent={aiProposal.improved}
          onApprove={handleApproveAIChanges}
          onReject={() => {
            setAiApprovalOpen(false);
            setAiProposal(null);
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
        title="AI Polish Diary"
        presets={DIARY_PRESETS}
        initialLanguage={aiLanguage}
        error={errorMessage}
      />
    </div>
  );
};
