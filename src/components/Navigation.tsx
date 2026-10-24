import React from 'react';
import {
  BookOpen,
  CalendarDays,
  Lightbulb,
  Target,
  BookMarked,
  Settings,
} from 'lucide-react';
import { NavigationTab } from '../types/index.ts';

interface NavigationProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
}

interface NavItem {
  key: NavigationTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'bookshelf', label: 'Bookshelf', icon: BookOpen },
  { key: 'diary', label: 'Diary', icon: CalendarDays },
  { key: 'ideas', label: 'Ideas', icon: Lightbulb },
  { key: 'milestone', label: 'Milestone', icon: Target },
  { key: 'notebooks', label: 'Notebooks', icon: BookMarked },
  { key: 'settings', label: 'Settings', icon: Settings },
];

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onSelectTab }) => {
  return (
    <>
      {/* Fixed Bottom Navigation Bar - Exactly 6 items as strictly required */}
      <nav
        aria-label="Primary Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 safe-bottom"
      >
        <div className="max-w-4xl mx-auto px-2">
          <div className="grid grid-cols-6 items-center h-16">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onSelectTab(item.key)}
                  className={`group flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] py-1 transition-all relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 ${
                    isActive
                      ? 'text-neutral-950 dark:text-white'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                  }`}
                >
                  {/* Subtle active pill indicator line at top */}
                  {isActive && (
                    <span className="absolute top-0 w-8 h-0.5 bg-neutral-950 dark:bg-white rounded-full transition-all" />
                  )}

                  <div
                    className={`p-1 rounded-lg transition-transform ${
                      isActive ? 'scale-110' : 'group-hover:scale-105'
                    }`}
                  >
                    <Icon className="w-5 h-5 transition-colors" />
                  </div>

                  <span
                    className={`text-[10px] tracking-tight truncate max-w-full px-0.5 mt-0.5 ${
                      isActive ? 'font-semibold' : 'font-medium'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Desktop Top Header Bar for expansive 1440px presence with Brand Wordmark and active view */}
      <header className="hidden lg:block sticky top-0 z-30 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="font-serif text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
              LifeNote AI
            </span>
          </div>

          {/* Zone 2: The 6 Navigation items as clean text with subtle active state */}
          <div className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onSelectTab(item.key)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Zone 3: Editorial tag */}
          <div className="flex items-center gap-3 text-xs text-neutral-500 font-mono shrink-0">
            <span>Archival Workspace</span>
          </div>
        </div>
      </header>
    </>
  );
};
