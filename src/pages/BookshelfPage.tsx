import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.ts';
import { Notebook, DiaryEntry, NavigationTab } from '../types/index.ts';
import { BookCoverCard } from '../components/BookCoverCard.tsx';
import { ReadingMode } from '../components/ReadingMode.tsx';
import { BookOpen, Sparkles, Filter, RefreshCw, ArrowRight } from 'lucide-react';

interface BookshelfPageProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const BookshelfPage: React.FC<BookshelfPageProps> = ({ onNavigate }) => {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'all' | 'notebooks' | 'diary'>('all');

  // Reading mode state
  const [readingBook, setReadingBook] = useState<{
    title: string;
    subtitle?: string;
    category?: string;
    type: 'notebook' | 'diary';
    items: any[];
  } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [nbRes, diaryRes] = await Promise.all([
        api.getNotebooks(),
        api.getDiaryEntries(),
      ]);
      setNotebooks(nbRes.notebooks || []);
      setDiaryEntries(diaryRes.entries || []);
    } catch (err) {
      console.error('Failed to load bookshelf data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openNotebook = async (notebook: Notebook) => {
    try {
      const res = await api.getNotebook(notebook._id);
      setReadingBook({
        title: notebook.title,
        subtitle: notebook.description,
        category: notebook.category,
        type: 'notebook',
        items: res.notes || [],
      });
    } catch (err) {
      console.error('Failed to open notebook for reading', err);
    }
  };

  const openDiaryBook = () => {
    setReadingBook({
      title: 'Personal Chronicle & Reflections',
      subtitle: `${diaryEntries.length} chronological entries`,
      category: 'Journal',
      type: 'diary',
      items: diaryEntries,
    });
  };

  const openSingleDiaryEntry = (entry: DiaryEntry) => {
    setReadingBook({
      title: entry.title,
      subtitle: entry.date,
      category: 'Diary Entry',
      type: 'diary',
      items: [entry],
    });
  };

  return (
    <div className="min-h-full pb-20 pt-4 px-3 md:px-6 max-w-7xl mx-auto">
      {/* Compact Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <h1 className="text-xl md:text-2xl font-serif font-bold text-neutral-900 dark:text-white tracking-tight">
            The Bookshelf
          </h1>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
            {notebooks.length + (diaryEntries.length > 0 ? 1 : 0)} volumes
          </span>
        </div>

        {/* Filter Segmented Flex Control */}
        <div className="flex items-center gap-1 p-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg shrink-0 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              filter === 'all'
                ? 'bg-white dark:bg-neutral-700 text-neutral-950 dark:text-white shadow-xs font-medium'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            All Volumes
          </button>
          <button
            onClick={() => setFilter('notebooks')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              filter === 'notebooks'
                ? 'bg-white dark:bg-neutral-700 text-neutral-950 dark:text-white shadow-xs font-medium'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            Notebooks ({notebooks.length})
          </button>
          <button
            onClick={() => setFilter('diary')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              filter === 'diary'
                ? 'bg-white dark:bg-neutral-700 text-neutral-950 dark:text-white shadow-xs font-medium'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            Diary ({diaryEntries.length})
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 mt-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse space-y-2">
              <div className="aspect-[3/4] bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
              <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : notebooks.length === 0 && diaryEntries.length === 0 ? (
        /* Empty State */
        <div className="my-14 text-center max-w-sm mx-auto p-6 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-800">
          <BookOpen className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
            Your Bookshelf is Empty
          </h3>
          <p className="text-xs text-neutral-500 mt-1 mb-4">
            Begin by writing a diary entry or creating your first notebook volume.
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => onNavigate('diary')}
              className="px-3 py-1.5 text-xs font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg"
            >
              Write in Diary
            </button>
            <button
              onClick={() => onNavigate('notebooks')}
              className="px-3 py-1.5 text-xs font-medium border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-100"
            >
              New Notebook
            </button>
          </div>
        </div>
      ) : (
        /* Bookshelf Display with compact realistic shelves */
        <div className="mt-4 space-y-6">
          {/* Section: Complete Diary Book Volume */}
          {(filter === 'all' || filter === 'diary') && diaryEntries.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-serif font-bold text-neutral-900 dark:text-white">
                    Personal Chronicles
                  </h2>
                  <span className="text-[11px] text-neutral-400 font-mono">
                    ({diaryEntries.length} entries)
                  </span>
                </div>
                <button
                  onClick={openDiaryBook}
                  className="text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white flex items-center gap-1"
                >
                  <span>Read Full Journal</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Shelf row */}
              <div className="relative pb-3 border-b-4 border-neutral-300 dark:border-neutral-800">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {/* Master Diary Tome */}
                  <BookCoverCard
                    title="Chronicles of Self"
                    subtitle="Full Diary"
                    coverStyle="linen"
                    category="Volume"
                    itemCount={diaryEntries.length}
                    itemType="diary"
                    onClick={openDiaryBook}
                  />

                  {/* Individual recent diary entries as mini-volumes */}
                  {diaryEntries.slice(0, 5).map((entry) => (
                    <BookCoverCard
                      key={entry._id}
                      title={entry.title}
                      subtitle={entry.date}
                      coverStyle={entry.coverStyle || 'leather'}
                      category="Entry"
                      itemCount={1}
                      itemType="diary"
                      onClick={() => openSingleDiaryEntry(entry)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section: Notebooks Shelf */}
          {(filter === 'all' || filter === 'notebooks') && notebooks.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-serif font-bold text-neutral-900 dark:text-white">
                    Notebooks & Anthologies
                  </h2>
                  <span className="text-[11px] text-neutral-400 font-mono">
                    ({notebooks.length} volumes)
                  </span>
                </div>
              </div>

              {/* Shelf row */}
              <div className="relative pb-3 border-b-4 border-neutral-300 dark:border-neutral-800">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {notebooks.map((nb) => (
                    <BookCoverCard
                      key={nb._id}
                      title={nb.title}
                      subtitle={nb.description}
                      coverStyle={nb.coverStyle || 'leather'}
                      category={nb.category}
                      itemCount={nb.noteCount || nb.notes?.length || 0}
                      itemType="notebook"
                      onClick={() => openNotebook(nb)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reading Mode Overlay */}
      {readingBook && (
        <ReadingMode
          title={readingBook.title}
          subtitle={readingBook.subtitle}
          category={readingBook.category}
          type={readingBook.type}
          items={readingBook.items}
          onClose={() => setReadingBook(null)}
        />
      )}
    </div>
  );
};
