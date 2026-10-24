/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { NavigationTab } from './types/index.ts';
import { Navigation } from './components/Navigation.tsx';
import { BookshelfPage } from './pages/BookshelfPage.tsx';
import { DiaryPage } from './pages/DiaryPage.tsx';
import { IdeasPage } from './pages/IdeasPage.tsx';
import { MilestonePage } from './pages/MilestonePage.tsx';
import { NotebooksPage } from './pages/NotebooksPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { BookOpen } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavigationTab>('bookshelf');
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);

  // Apply theme to document root
  useEffect(() => {
    const theme = user?.preferences?.theme || 'light';
    const root = document.documentElement;
    root.classList.remove('dark', 'sepia');

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'sepia') {
      root.classList.add('sepia');
    }
  }, [user?.preferences?.theme]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center shadow-md animate-pulse mb-4">
          <BookOpen className="w-6 h-6" />
        </div>
        <p className="font-serif text-lg font-semibold text-neutral-900 dark:text-white">
          LifeNote AI
        </p>
        <p className="text-xs text-neutral-500 font-mono mt-1">
          Loading personal workspace...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 flex flex-col transition-colors selection:bg-neutral-900 selection:text-white">
      {/* Primary Navigation (Desktop Top Bar + Mobile Fixed 6-Tab Bottom Bar) */}
      <Navigation currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Main View Area */}
      <main className="flex-1 w-full">
        {currentTab === 'bookshelf' && <BookshelfPage onNavigate={setCurrentTab} />}
        {currentTab === 'diary' && <DiaryPage />}
        {currentTab === 'ideas' && <IdeasPage />}
        {currentTab === 'milestone' && <MilestonePage />}
        {currentTab === 'notebooks' && <NotebooksPage />}
        {currentTab === 'settings' && (
          <SettingsPage onOpenAuthModal={() => setAuthModalOpen(true)} />
        )}
      </main>

      {/* Account Sign In / Switch Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
