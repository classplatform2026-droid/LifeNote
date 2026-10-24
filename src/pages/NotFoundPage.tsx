import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookX, ArrowLeft, BookOpen, CalendarDays, BookMarked, Target, Lightbulb } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = '404 - Page Not Found | LifeNote AI';
  }, []);

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full text-center space-y-6">
        {/* Archival 404 Badge & Icon */}
        <div className="inline-flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 flex items-center justify-center shadow-xs mb-3 border border-neutral-200 dark:border-neutral-700">
            <BookX className="w-8 h-8 text-amber-600 dark:text-amber-400 stroke-[1.75]" />
          </div>
          <span className="font-mono text-xs uppercase tracking-widest px-2.5 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-semibold">
            Error 404 · Missing Tome
          </span>
        </div>

        {/* Headline & Description */}
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-neutral-900 dark:text-white tracking-tight">
            This Page Does Not Exist in the Archives
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
            The volume, manuscript, or link you are seeking has been moved, uncatalogued, or never existed in your personal workspace.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go Back</span>
          </button>

          <Link
            to="/bookshelf"
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition-opacity shadow-xs"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Return to Bookshelf</span>
          </Link>
        </div>

        {/* Quick Directory Links */}
        <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800">
          <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-3">
            Quick Navigation
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <Link
              to="/diary"
              className="p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700 flex flex-col items-center gap-1.5 transition-colors group"
            >
              <CalendarDays className="w-4 h-4 text-neutral-500 group-hover:text-amber-500 transition-colors" />
              <span className="font-medium text-neutral-700 dark:text-neutral-300">Diary</span>
            </Link>

            <Link
              to="/notebooks"
              className="p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700 flex flex-col items-center gap-1.5 transition-colors group"
            >
              <BookMarked className="w-4 h-4 text-neutral-500 group-hover:text-amber-500 transition-colors" />
              <span className="font-medium text-neutral-700 dark:text-neutral-300">Notebooks</span>
            </Link>

            <Link
              to="/milestone"
              className="p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700 flex flex-col items-center gap-1.5 transition-colors group"
            >
              <Target className="w-4 h-4 text-neutral-500 group-hover:text-amber-500 transition-colors" />
              <span className="font-medium text-neutral-700 dark:text-neutral-300">Milestones</span>
            </Link>

            <Link
              to="/ideas"
              className="p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700 flex flex-col items-center gap-1.5 transition-colors group"
            >
              <Lightbulb className="w-4 h-4 text-neutral-500 group-hover:text-amber-500 transition-colors" />
              <span className="font-medium text-neutral-700 dark:text-neutral-300">Ideas</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
