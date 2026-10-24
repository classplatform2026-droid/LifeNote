import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  List,
  SlidersHorizontal,
  Bookmark,
  Calendar,
  Tag,
} from 'lucide-react';
import { Note, DiaryEntry } from '../types/index.ts';

interface ReadingModeProps {
  title: string;
  subtitle?: string;
  category?: string;
  type: 'notebook' | 'diary';
  items: Array<Note | DiaryEntry>;
  initialIndex?: number;
  onClose: () => void;
}

export const ReadingMode: React.FC<ReadingModeProps> = ({
  title,
  subtitle,
  category,
  type,
  items,
  initialIndex = 0,
  onClose,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(initialIndex);
  const [showToc, setShowToc] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [paperTheme, setPaperTheme] = useState<'cream' | 'parchment' | 'dark'>('cream');
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>('serif');

  const totalPages = items.length;
  const currentItem = items[currentPage] || null;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        setCurrentPage((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalPages, onClose]);

  const paperStyles = {
    cream: 'bg-[#faf8f4] text-neutral-800 border-neutral-300 shadow-xl',
    parchment: 'bg-[#f4efe4] text-amber-950 border-amber-200/80 shadow-xl',
    dark: 'bg-[#18181b] text-neutral-200 border-neutral-800 shadow-2xl',
  };

  const fontClasses = {
    serif: 'font-serif',
    sans: 'font-sans',
  };

  const fontSizeClasses = {
    sm: 'text-sm leading-relaxed',
    base: 'text-base leading-relaxed',
    lg: 'text-lg leading-loose',
    xl: 'text-xl leading-loose',
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-900/90 backdrop-blur-md transition-colors overflow-hidden">
      {/* Top Reading Navigation Bar */}
      <header className="h-14 px-4 md:px-8 border-b border-white/10 flex items-center justify-between text-neutral-300 bg-neutral-950/70 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-200 hover:text-white transition-colors text-xs font-medium"
            title="Back to Bookshelf"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <span className="text-white/20">|</span>

          <button
            onClick={() => setShowToc(!showToc)}
            className={`p-2 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-1.5 text-xs font-medium ${
              showToc ? 'bg-white/15 text-white' : ''
            }`}
            title="Table of Contents"
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">Contents</span>
          </button>

          <span className="text-white/20">|</span>

          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest font-mono text-neutral-400">
              {category || (type === 'diary' ? 'Journal' : 'Notebook')}
            </span>
            <span className="text-xs text-white/40">/</span>
            <h2 className="text-sm font-semibold text-white truncate max-w-[200px] md:max-w-md">
              {title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Settings Trigger */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg hover:bg-white/10 transition-colors ${
              showSettings ? 'bg-white/15 text-white' : ''
            }`}
            title="Reading Appearance"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {/* Close Reading Mode */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/15 text-neutral-300 hover:text-white transition-colors"
            title="Exit Reading Mode (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Reading Canvas & Book Page */}
      <div className="relative flex-1 flex items-center justify-center p-3 md:p-8 overflow-y-auto">
        {/* Table of Contents Drawer */}
        {showToc && (
          <aside className="absolute left-4 top-4 bottom-4 w-72 md:w-80 bg-neutral-950/95 border border-white/10 rounded-2xl shadow-2xl z-30 flex flex-col overflow-hidden backdrop-blur-xl">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white tracking-wide">
                Table of Contents ({totalPages})
              </h3>
              <button
                onClick={() => setShowToc(false)}
                className="p-1 text-neutral-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 divide-y divide-white/5">
              {items.map((item, index) => {
                const isDiary = 'date' in item;
                const isCurrent = index === currentPage;
                return (
                  <button
                    key={item._id || index}
                    onClick={() => {
                      setCurrentPage(index);
                      setShowToc(false);
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-colors flex items-start gap-2.5 ${
                      isCurrent
                        ? 'bg-amber-500/15 text-amber-200 font-medium'
                        : 'text-neutral-300 hover:bg-white/5'
                    }`}
                  >
                    <span className="font-mono text-xs text-neutral-500 mt-0.5">
                      {String(index + 1).padStart(2, '0')}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{item.title || 'Untitled'}</p>
                      {isDiary && (
                        <p className="text-xs text-neutral-400 font-mono mt-0.5">
                          {(item as DiaryEntry).date}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>
        )}

        {/* Reading Appearance Settings Modal */}
        {showSettings && (
          <aside className="absolute right-4 top-4 w-72 bg-neutral-950/95 border border-white/10 rounded-2xl shadow-2xl z-30 p-4 space-y-4 text-xs text-neutral-200 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="font-semibold text-white">Reading Preferences</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 text-neutral-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Paper tone */}
            <div>
              <label className="text-neutral-400 block mb-1.5 font-medium">Paper Tone</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPaperTheme('cream')}
                  className={`py-1.5 px-2 rounded border text-center transition-all ${
                    paperTheme === 'cream'
                      ? 'border-amber-400 bg-[#faf8f4] text-neutral-900 font-semibold ring-1 ring-amber-400'
                      : 'border-white/10 bg-[#faf8f4]/15 text-neutral-300 hover:bg-[#faf8f4]/25'
                  }`}
                >
                  Cream
                </button>
                <button
                  onClick={() => setPaperTheme('parchment')}
                  className={`py-1.5 px-2 rounded border text-center transition-all ${
                    paperTheme === 'parchment'
                      ? 'border-amber-400 bg-[#f4efe4] text-amber-950 font-semibold ring-1 ring-amber-400'
                      : 'border-white/10 bg-[#f4efe4]/15 text-neutral-300 hover:bg-[#f4efe4]/25'
                  }`}
                >
                  Parchment
                </button>
                <button
                  onClick={() => setPaperTheme('dark')}
                  className={`py-1.5 px-2 rounded border text-center transition-all ${
                    paperTheme === 'dark'
                      ? 'border-white bg-[#18181b] text-white font-semibold ring-1 ring-white'
                      : 'border-white/10 bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  }`}
                >
                  Obsidian
                </button>
              </div>
            </div>

            {/* Typography */}
            <div>
              <label className="text-neutral-400 block mb-1.5 font-medium">Font Family</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setFontFamily('serif')}
                  className={`py-1.5 px-2 rounded border text-center font-serif text-sm transition-all ${
                    fontFamily === 'serif'
                      ? 'border-amber-400 bg-white/10 text-white font-medium ring-1 ring-amber-400'
                      : 'border-white/10 text-neutral-400 hover:bg-white/5'
                  }`}
                >
                  Book Serif
                </button>
                <button
                  onClick={() => setFontFamily('sans')}
                  className={`py-1.5 px-2 rounded border text-center font-sans text-sm transition-all ${
                    fontFamily === 'sans'
                      ? 'border-amber-400 bg-white/10 text-white font-medium ring-1 ring-amber-400'
                      : 'border-white/10 text-neutral-400 hover:bg-white/5'
                  }`}
                >
                  Modern Sans
                </button>
              </div>
            </div>

            {/* Font Size */}
            <div>
              <label className="text-neutral-400 block mb-1.5 font-medium">Type Size</label>
              <div className="flex items-center gap-1.5">
                {(['sm', 'base', 'lg', 'xl'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => setFontSize(size)}
                    className={`flex-1 py-1.5 rounded uppercase font-mono text-[11px] border transition-all ${
                      fontSize === size
                        ? 'border-amber-400 bg-white/15 text-white font-bold'
                        : 'border-white/10 text-neutral-400 hover:bg-white/5'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        )}

        {/* Paper Book Viewport */}
        <article
          className={`relative w-full max-w-3xl min-h-[550px] md:min-h-[640px] rounded-2xl p-6 md:p-14 border transition-all ${
            paperStyles[paperTheme]
          } ${fontClasses[fontFamily]}`}
        >
          {/* Subtle Paper Spine and Stitching Shadow on Left */}
          <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/10 via-black/5 to-transparent pointer-events-none rounded-l-2xl" />
          <div className="absolute inset-y-6 left-5 w-px border-l border-dashed border-neutral-400/30 pointer-events-none" />

          {/* Paper Texture and Page Header */}
          {currentItem ? (
            <div className="relative z-10 flex flex-col h-full">
              {/* Header Plate */}
              <div className="border-b border-current/15 pb-4 mb-6 flex flex-wrap items-center justify-between gap-2 text-xs opacity-75">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-3.5 h-3.5" />
                  <span className="font-mono">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                </div>

                {'date' in currentItem && (
                  <div className="flex items-center gap-1.5 font-mono">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{(currentItem as DiaryEntry).date}</span>
                    {(currentItem as DiaryEntry).mood && (
                      <span className="capitalize italic">· {(currentItem as DiaryEntry).mood}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-6">
                {currentItem.title || 'Untitled Entry'}
              </h1>

              {/* Tags */}
              {currentItem.tags && currentItem.tags.length > 0 && (
                <div className="flex items-center gap-2 text-xs opacity-60 mb-6">
                  <Tag className="w-3 h-3" />
                  <span>{currentItem.tags.join(' · ')}</span>
                </div>
              )}

              {/* Rich Text Body Content */}
              <div
                className={`prose prose-neutral max-w-none flex-1 leading-relaxed ${fontSizeClasses[fontSize]}`}
                dangerouslySetInnerHTML={{ __html: currentItem.content || '<p><em>Empty page.</em></p>' }}
              />

              {/* Footer Note */}
              <div className="border-t border-current/15 pt-4 mt-8 flex items-center justify-between text-xs opacity-60 font-mono">
                <span>{title}</span>
                <span>LifeNote Archival Mode</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 text-center opacity-60">
              <p>No content in this book yet.</p>
            </div>
          )}
        </article>
      </div>

      {/* Bottom Page Navigation Controls */}
      <footer className="h-16 px-4 md:px-8 border-t border-white/10 flex items-center justify-between bg-neutral-950/80 shrink-0 text-white">
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 0))}
          disabled={currentPage === 0}
          className="flex items-center gap-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none transition-colors text-xs font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous Page</span>
        </button>

        {/* Page Slider / Indicator */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-neutral-400">
            {currentPage + 1} / {totalPages || 1}
          </span>
          <input
            type="range"
            min={0}
            max={Math.max(totalPages - 1, 0)}
            value={currentPage}
            onChange={(e) => setCurrentPage(parseInt(e.target.value, 10))}
            className="w-24 md:w-48 accent-amber-500 cursor-pointer"
          />
        </div>

        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages - 1))}
          disabled={currentPage >= totalPages - 1}
          className="flex items-center gap-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none transition-colors text-xs font-medium"
        >
          <span>Next Page</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </footer>
    </div>
  );
};
