import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.ts';
import { Notebook, Note, AILanguage } from '../types/index.ts';
import { RichTextEditor } from '../components/RichTextEditor.tsx';
import { AIApprovalModal } from '../components/AIApprovalModal.tsx';
import { AIPolishModal, AIPolishPreset } from '../components/AIPolishModal.tsx';
import {
  BookMarked,
  Plus,
  Search,
  Trash2,
  Edit3,
  Sparkles,
  Pin,
  Check,
  X,
  RefreshCw,
  FolderOpen,
  FileText,
  Globe,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

const NOTE_PRESETS: AIPolishPreset[] = [
  { id: 'polish', label: 'Polish Flow & Cadence', description: 'Enhance clarity, phrasing, and smooth prose' },
  { id: 'structure', label: 'Semantic Sections', description: 'Structured headings, bullet points, and quotes' },
  { id: 'summarize', label: 'Executive Summary', description: 'High-level synthesis & key takeaways' },
  { id: 'action_items', label: 'Action Checklist', description: 'Extract concrete action steps' },
];

export const NotebooksPage: React.FC = () => {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [activeNotebook, setActiveNotebook] = useState<Notebook | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [notesLoading, setNotesLoading] = useState<boolean>(false);
  const [noteSearch, setNoteSearch] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Notebook Create / Edit Modal
  const [notebookModalOpen, setNotebookModalOpen] = useState<boolean>(false);
  const [editingNotebook, setEditingNotebook] = useState<Notebook | null>(null);
  const [nbTitle, setNbTitle] = useState<string>('');
  const [nbDescription, setNbDescription] = useState<string>('');
  const [nbCategory, setNbCategory] = useState<string>('General');
  const [nbCoverStyle, setNbCoverStyle] = useState<Notebook['coverStyle']>('leather');

  // Active Note Editor Form State
  const [noteTitle, setNoteTitle] = useState<string>('');
  const [noteContent, setNoteContent] = useState<string>('');
  const [noteTagsInput, setNoteTagsInput] = useState<string>('');
  const [notePinned, setNotePinned] = useState<boolean>(false);
  const [isSavingNote, setIsSavingNote] = useState<boolean>(false);
  const [isCreatingNote, setIsCreatingNote] = useState<boolean>(false);
  const [isEditingNote, setIsEditingNote] = useState<boolean>(false);

  // AI Refinement State
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [polishModalOpen, setPolishModalOpen] = useState<boolean>(false);
  const [aiApprovalOpen, setAiApprovalOpen] = useState<boolean>(false);
  const [aiAction, setAiAction] = useState<string>('polish');
  const [aiLanguage, setAiLanguage] = useState<AILanguage>('unique');
  const [aiProposal, setAiProposal] = useState<{
    original: string;
    refined: string;
    summary: string;
    language?: AILanguage;
  } | null>(null);
  const [wasAIApplied, setWasAIApplied] = useState<boolean>(false);

  // Fetch Notebooks
  const fetchNotebooks = async () => {
    try {
      setLoading(true);
      const res = await api.getNotebooks();
      setNotebooks(res.notebooks || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load notebooks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotebooks();
  }, []);

  // Fetch notes when activeNotebook changes or noteSearch changes
  useEffect(() => {
    if (!activeNotebook) {
      setNotes([]);
      return;
    }
    const fetchNotes = async () => {
      try {
        setNotesLoading(true);
        const res = await api.getNotes(activeNotebook._id, noteSearch);
        setNotes(res.notes || []);
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to fetch notes.');
      } finally {
        setNotesLoading(false);
      }
    };
    fetchNotes();
  }, [activeNotebook?._id, noteSearch]);

  const handleSelectNote = (note: Note) => {
    setActiveNote(note);
    setIsCreatingNote(false);
    setIsEditingNote(false);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteTagsInput(note.tags ? note.tags.join(', ') : '');
    setNotePinned(note.pinned);
  };

  const handleStartNewNote = () => {
    setActiveNote(null);
    setIsCreatingNote(true);
    setIsEditingNote(true);
    setNoteTitle('');
    setNoteContent('');
    setNoteTagsInput('');
    setNotePinned(false);
  };

  const handleSaveNote = async () => {
    if (!activeNotebook) return;
    if (!noteTitle.trim()) {
      setErrorMessage('Note title is required.');
      return;
    }

    try {
      setIsSavingNote(true);
      setErrorMessage('');
      const tags = noteTagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      if (isCreatingNote) {
        const res = await api.createNote(activeNotebook._id, {
          title: noteTitle,
          content: noteContent,
          tags,
          pinned: notePinned,
        });
        setNotes([res.note, ...notes]);
        setActiveNote(res.note);
        setIsCreatingNote(false);
        setIsEditingNote(false);
      } else if (activeNote) {
        const res = await api.updateNote(activeNotebook._id, activeNote._id, {
          title: noteTitle,
          content: noteContent,
          tags,
          pinned: notePinned,
        });
        setNotes(notes.map((n) => (n._id === res.note._id ? res.note : n)));
        setActiveNote(res.note);
        setIsEditingNote(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save note.');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!activeNotebook) return;
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      await api.deleteNote(activeNotebook._id, noteId);
      const remaining = notes.filter((n) => n._id !== noteId);
      setNotes(remaining);
      if (activeNote?._id === noteId) {
        if (remaining.length > 0) {
          handleSelectNote(remaining[0]);
        } else {
          handleStartNewNote();
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete note.');
    }
  };

  // Notebook CRUD
  const handleOpenCreateNotebook = () => {
    setEditingNotebook(null);
    setNbTitle('');
    setNbDescription('');
    setNbCategory('General');
    setNbCoverStyle('leather');
    setNotebookModalOpen(true);
  };

  const handleOpenEditNotebook = (nb: Notebook) => {
    setEditingNotebook(nb);
    setNbTitle(nb.title);
    setNbDescription(nb.description || '');
    setNbCategory(nb.category || 'General');
    setNbCoverStyle(nb.coverStyle || 'leather');
    setNotebookModalOpen(true);
  };

  const handleSaveNotebook = async () => {
    if (!nbTitle.trim()) {
      setErrorMessage('Notebook title is required.');
      return;
    }
    try {
      if (editingNotebook) {
        const res = await api.updateNotebook(editingNotebook._id, {
          title: nbTitle,
          description: nbDescription,
          category: nbCategory,
          coverStyle: nbCoverStyle,
        });
        setNotebooks(notebooks.map((n) => (n._id === res.notebook._id ? res.notebook : n)));
        if (activeNotebook?._id === res.notebook._id) {
          setActiveNotebook(res.notebook);
        }
      } else {
        const res = await api.createNotebook({
          title: nbTitle,
          description: nbDescription,
          category: nbCategory,
          coverStyle: nbCoverStyle,
        });
        setNotebooks([...notebooks, res.notebook]);
        setActiveNotebook(res.notebook);
      }
      setNotebookModalOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save notebook.');
    }
  };

  const handleDeleteNotebook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notebook and all its notes?')) return;
    try {
      await api.deleteNotebook(id);
      const remaining = notebooks.filter((n) => n._id !== id);
      setNotebooks(remaining);
      if (activeNotebook?._id === id) {
        setActiveNotebook(remaining[0] || null);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete notebook.');
    }
  };

  // AI Refinement Flow via Modal
  const handleApplyAIPolish = async (data: { preset: string; customCommand: string; language: AILanguage }) => {
    if (!noteContent.trim()) {
      setErrorMessage('Write some note content before refining with AI.');
      return;
    }
    try {
      setAiLoading(true);
      setErrorMessage('');
      const res = await api.refineNote({
        content: noteContent,
        action: data.preset,
        noteTitle: noteTitle || 'Untitled Note',
        language: data.language,
        customCommand: data.customCommand,
      });
      setPolishModalOpen(false);
      setAiProposal({
        original: noteContent,
        refined: res.refinedContent,
        summary: res.summary,
        language: data.language,
      });
      setAiApprovalOpen(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'AI refinement failed.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleApproveAIRefinement = async () => {
    if (!aiProposal) return;
    try {
      setIsSavingNote(true);
      setNoteContent(aiProposal.refined);

      // If viewing an existing note, commit directly to MongoDB
      if (activeNotebook && activeNote && !isCreatingNote) {
        const res = await api.updateNote(activeNotebook._id, activeNote._id, {
          content: aiProposal.refined,
        });
        setNotes(notes.map((n) => (n._id === res.note._id ? res.note : n)));
        setActiveNote(res.note);
      }

      setAiApprovalOpen(false);
      setAiProposal(null);
      setWasAIApplied(true);
      setTimeout(() => setWasAIApplied(false), 2500);
    } catch (err: any) {
      setErrorMessage('Failed to apply AI changes to database.');
    } finally {
      setIsSavingNote(false);
    }
  };

  return (
    <div className="min-h-full pb-20 pt-4 px-3 md:px-6 max-w-7xl mx-auto">
      {/* Level 1: All Notebooks Overview (When no notebook is selected) */}
      {!activeNotebook ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl md:text-2xl font-serif font-bold text-neutral-900 dark:text-white tracking-tight">
                Notebooks & Manuscripts
              </h1>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                {notebooks.length} volumes
              </span>
            </div>

            <button
              onClick={handleOpenCreateNotebook}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg text-xs font-medium shadow-xs hover:opacity-90 transition-all shrink-0 active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Notebook</span>
            </button>
          </div>

          {errorMessage && (
            <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-800 dark:text-red-300 flex items-center justify-between">
              <span>{errorMessage}</span>
              <button onClick={() => setErrorMessage('')} className="p-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-36 bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : notebooks.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-neutral-300 dark:border-neutral-800 rounded-xl mt-4">
              <BookMarked className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                No Notebooks Created
              </h3>
              <p className="text-xs text-neutral-500 mt-1 mb-3">
                Create your first notebook volume to begin writing.
              </p>
              <button
                onClick={handleOpenCreateNotebook}
                className="px-3.5 py-1.5 text-xs font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg"
              >
                Create Notebook
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
              {notebooks.map((nb) => (
                <div
                  key={nb._id}
                  onClick={() => {
                    setActiveNotebook(nb);
                    setActiveNote(null);
                    setIsCreatingNote(false);
                  }}
                  role="button"
                  tabIndex={0}
                  className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-400 dark:hover:border-neutral-700 cursor-pointer transition-all shadow-xs hover:shadow-sm group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-neutral-400 font-mono mb-2">
                      <span className="uppercase text-[10px] tracking-wider px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-sans">
                        {nb.category || 'General'}
                      </span>
                      <span>{nb.noteCount || nb.notes?.length || 0} notes</span>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 shrink-0 mt-0.5">
                        <BookMarked className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm md:text-base font-semibold text-neutral-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                          {nb.title}
                        </h3>
                        {nb.description && (
                          <p className="text-xs text-neutral-500 line-clamp-2 mt-1 font-serif leading-relaxed">
                            {nb.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs">
                    <span className="text-[11px] text-neutral-400 flex items-center gap-1 group-hover:text-neutral-600 dark:group-hover:text-neutral-300">
                      <span>Open Volume</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditNotebook(nb);
                        }}
                        className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded"
                        title="Edit Notebook"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNotebook(nb._id);
                        }}
                        className="p-1 text-neutral-400 hover:text-red-600 rounded"
                        title="Delete Notebook"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : !activeNote && !isCreatingNote ? (
        /* Level 2: Dedicated Notebook View with Notes List */
        <div className="space-y-4">
          {/* Notebook Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-200 dark:border-neutral-800">
            <button
              onClick={() => {
                setActiveNotebook(null);
                setActiveNote(null);
                setIsCreatingNote(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-all shadow-2xs active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
              <span>Back to Notebooks</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenEditNotebook(activeNotebook)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg border border-neutral-200 dark:border-neutral-800"
                title="Edit Notebook"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Volume</span>
              </button>
              <button
                onClick={handleStartNewNote}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg text-xs font-medium shadow-xs hover:opacity-90 transition-all active:scale-[0.98]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Note</span>
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-800 dark:text-red-300 flex items-center justify-between">
              <span>{errorMessage}</span>
              <button onClick={() => setErrorMessage('')} className="p-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Notebook Header Card */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="uppercase text-[10px] font-mono tracking-wider px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                  {activeNotebook.category || 'General'}
                </span>
                <span className="text-xs text-neutral-400 font-mono">
                  {notes.length} notes
                </span>
              </div>
              <h2 className="text-lg md:text-xl font-serif font-bold text-neutral-900 dark:text-white">
                {activeNotebook.title}
              </h2>
              {activeNotebook.description && (
                <p className="text-xs text-neutral-500 mt-1 max-w-2xl font-serif">
                  {activeNotebook.description}
                </p>
              )}
            </div>

            {/* Note Search */}
            <div className="relative min-w-[200px] w-full sm:w-auto">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={noteSearch}
                onChange={(e) => setNoteSearch(e.target.value)}
                placeholder="Search notes in volume..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:border-neutral-500"
              />
            </div>
          </div>

          {/* Notes List / Grid */}
          {notesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : notes.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-neutral-300 dark:border-neutral-800 rounded-xl">
              <FileText className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
              <p className="text-xs text-neutral-500">No notes in this notebook volume.</p>
              <button
                onClick={handleStartNewNote}
                className="mt-3 px-3.5 py-1.5 text-xs font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg"
              >
                Create first note
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {notes.map((note) => (
                <div
                  key={note._id}
                  onClick={() => handleSelectNote(note)}
                  role="button"
                  tabIndex={0}
                  className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-400 dark:hover:border-neutral-700 cursor-pointer transition-all shadow-xs hover:shadow-sm group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1.5 font-mono">
                      <span>{new Date(note.updatedAt || Date.now()).toLocaleDateString()}</span>
                      {note.pinned && <Pin className="w-3 h-3 text-amber-500 fill-amber-500" />}
                    </div>

                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {note.title || 'Untitled Note'}
                    </h4>

                    <p className="text-xs text-neutral-500 line-clamp-3 mt-1.5 font-serif leading-relaxed">
                      {note.content.replace(/<[^>]+>/g, '') || 'Empty note...'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-neutral-100 dark:border-neutral-800 text-xs">
                    <span className="text-[11px] text-neutral-400 flex items-center gap-1 group-hover:text-neutral-600 dark:group-hover:text-neutral-300">
                      <span>Read / Edit</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(note._id);
                      }}
                      className="p-1 text-neutral-400 hover:text-red-600 rounded"
                      title="Delete Note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Level 3: Dedicated Full-Width Note Page (View vs Edit Mode) */
        <div className="mt-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 md:p-6 shadow-xs max-w-4xl mx-auto">
          {/* Dedicated Note Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-200 dark:border-neutral-800 mb-4">
            <button
              onClick={() => {
                setActiveNote(null);
                setIsCreatingNote(false);
                setIsEditingNote(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-all shadow-2xs active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
              <span>Back to {activeNotebook.title}</span>
            </button>

            {isEditingNote || isCreatingNote ? (
              /* Edit Mode Actions: AI Polish Button, Pin, Cancel, Save */
              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setPolishModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-lg text-xs font-medium border border-neutral-200 dark:border-neutral-700 transition-colors shadow-2xs"
                  title="Open AI Polish popup"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>AI Polish</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNotePinned(!notePinned)}
                  className={`p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 transition-colors ${
                    notePinned
                      ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700'
                      : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
                  }`}
                  title={notePinned ? 'Pinned note' : 'Pin note'}
                >
                  <Pin className={`w-3.5 h-3.5 ${notePinned ? 'fill-current' : ''}`} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (isCreatingNote) {
                      setActiveNote(null);
                      setIsCreatingNote(false);
                    } else if (activeNote) {
                      setNoteTitle(activeNote.title);
                      setNoteContent(activeNote.content);
                      setNoteTagsInput(activeNote.tags ? activeNote.tags.join(', ') : '');
                      setNotePinned(activeNote.pinned);
                    }
                    setIsEditingNote(false);
                  }}
                  className="px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 transition-colors"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSaveNote}
                  disabled={isSavingNote}
                  className="flex items-center gap-1 px-3.5 py-1.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg text-xs font-medium hover:opacity-90 transition-opacity shadow-xs"
                >
                  {isSavingNote ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  <span>Save Note</span>
                </button>
              </div>
            ) : activeNote ? (
              /* View Mode Actions: Edit, Pin, Delete (NO AI Polish directly visible) */
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const newPinned = !notePinned;
                    setNotePinned(newPinned);
                    api.updateNote(activeNotebook._id, activeNote._id, { pinned: newPinned });
                    setNotes(notes.map((n) => (n._id === activeNote._id ? { ...n, pinned: newPinned } : n)));
                  }}
                  className={`p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 transition-colors ${
                    notePinned
                      ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700'
                      : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
                  }`}
                  title={notePinned ? 'Pinned note' : 'Pin note'}
                >
                  <Pin className={`w-3.5 h-3.5 ${notePinned ? 'fill-current' : ''}`} />
                </button>

                <button
                  onClick={() => setIsEditingNote(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shadow-2xs"
                  title="Edit note"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => handleDeleteNote(activeNote._id)}
                  className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg border border-neutral-200 dark:border-neutral-800 transition-colors"
                  title="Delete note"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : null}
          </div>

          {errorMessage && (
            <div className="mb-3 p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-800 dark:text-red-300 flex items-center justify-between">
              <span>{errorMessage}</span>
              <button onClick={() => setErrorMessage('')} className="p-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {isEditingNote || isCreatingNote ? (
            /* Note Form Area (Editing) */
            <div className="space-y-3">
              <input
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Note Title..."
                className="w-full px-1 py-1.5 text-base md:text-xl font-serif font-bold bg-transparent border-b border-neutral-200 dark:border-neutral-800 focus:outline-none focus:border-neutral-500 placeholder:text-neutral-400"
              />

              {/* Full Width RichTextEditor */}
              <div>
                <RichTextEditor
                  content={noteContent}
                  onChange={setNoteContent}
                  placeholder="Capture knowledge, draft manuscripts, synthesize insights..."
                  minHeight="320px"
                  isAIProcessing={aiLoading}
                  aiProcessingLabel="AI is synthesizing and polishing note..."
                  wasAIApplied={wasAIApplied}
                />
              </div>

              {/* Tags Input */}
              <div className="pt-1">
                <input
                  type="text"
                  value={noteTagsInput}
                  onChange={(e) => setNoteTagsInput(e.target.value)}
                  placeholder="Tags (comma separated, e.g. psychology, deep work, chapter-1)..."
                  className="w-full px-2.5 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 rounded-md focus:outline-none focus:border-neutral-500"
                />
              </div>
            </div>
          ) : activeNote ? (
            /* Note View Area (Clean Reading View) */
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-mono mb-2">
                  <span>Last updated: {new Date(activeNote.updatedAt || Date.now()).toLocaleDateString()}</span>
                  {notePinned && <span className="text-amber-500 font-semibold">• Pinned</span>}
                </div>
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-neutral-900 dark:text-white leading-tight">
                  {noteTitle || 'Untitled Note'}
                </h1>
              </div>

              {/* Clean HTML Prose Reader */}
              <div
                className="prose dark:prose-invert max-w-none text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed min-h-[240px] pt-2"
                dangerouslySetInnerHTML={{ __html: noteContent || '<p className="italic text-neutral-400">Empty note content.</p>' }}
              />

              {noteTagsInput && (
                <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  {noteTagsInput.split(',').map((tag) => tag.trim()).filter(Boolean).map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-400 font-mono">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* Notebook Create / Edit Modal */}
      {notebookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl p-4 md:p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800 mb-3">
              <h3 className="text-base font-serif font-bold text-neutral-900 dark:text-white">
                {editingNotebook ? 'Edit Notebook Volume' : 'New Notebook Volume'}
              </h3>
              <button
                onClick={() => setNotebookModalOpen(false)}
                className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={nbTitle}
                  onChange={(e) => setNbTitle(e.target.value)}
                  placeholder="e.g. Philosophical Essays"
                  className="w-full px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={nbDescription}
                  onChange={(e) => setNbDescription(e.target.value)}
                  placeholder="e.g. Exploration of timeless ideas and human nature"
                  className="w-full px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={nbCategory}
                    onChange={(e) => setNbCategory(e.target.value)}
                    placeholder="General, Philosophy, etc."
                    className="w-full px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Cover Material
                  </label>
                  <select
                    value={nbCoverStyle}
                    onChange={(e) => setNbCoverStyle(e.target.value as any)}
                    className="w-full px-2 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none text-xs"
                  >
                    <option value="leather">Leather Bound</option>
                    <option value="linen">Linen Cloth</option>
                    <option value="charcoal">Charcoal Buckram</option>
                    <option value="parchment">Antique Parchment</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 mt-3 border-t border-neutral-200 dark:border-neutral-800">
              <button
                onClick={() => setNotebookModalOpen(false)}
                className="px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotebook}
                className="px-4 py-1.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg text-xs font-medium hover:opacity-90"
              >
                {editingNotebook ? 'Update Notebook' : 'Create Notebook'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Polish Modal */}
      <AIPolishModal
        isOpen={polishModalOpen}
        onClose={() => setPolishModalOpen(false)}
        onApply={handleApplyAIPolish}
        isLoading={aiLoading}
        title="AI Polish Note"
        presets={NOTE_PRESETS}
        initialLanguage={aiLanguage}
        error={errorMessage}
      />

      {/* AI Refinement Approval Modal */}
      {aiProposal && (
        <AIApprovalModal
          isOpen={aiApprovalOpen}
          title={`AI Editorial Refinement (${aiAction})`}
          summary={aiProposal.summary}
          language={aiProposal.language || aiLanguage}
          originalContent={aiProposal.original}
          suggestedContent={aiProposal.refined}
          onApprove={handleApproveAIRefinement}
          onReject={() => {
            setAiApprovalOpen(false);
            setAiProposal(null);
          }}
          isSaving={isSavingNote}
        />
      )}
    </div>
  );
};
