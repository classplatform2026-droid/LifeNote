/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navigation } from './components/Navigation.tsx';
import { BookshelfPage } from './pages/BookshelfPage.tsx';
import { DiaryPage } from './pages/DiaryPage.tsx';
import { IdeasPage } from './pages/IdeasPage.tsx';
import { MilestonePage } from './pages/MilestonePage.tsx';
import { NotebooksPage } from './pages/NotebooksPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';
import { NotFoundPage } from './pages/NotFoundPage.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { BookOpen } from 'lucide-react';

function AppLayout() {
  const { user, loading } = useAuth();
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
      <Navigation />

      {/* Main Routed View Area */}
      <main className="flex-1 w-full">
        <Routes>
          <Route path="/" element={<Navigate to="/bookshelf" replace />} />
          <Route path="/bookshelf" element={<BookshelfPage />} />
          <Route path="/diary" element={<DiaryPage />} />
          <Route path="/ideas" element={<IdeasPage />} />
          <Route path="/milestone" element={<MilestonePage />} />
          <Route path="/milestones" element={<Navigate to="/milestone" replace />} />
          <Route path="/notebooks" element={<NotebooksPage />} />
          <Route
            path="/settings"
            element={<SettingsPage onOpenAuthModal={() => setAuthModalOpen(true)} />}
          />
          {/* Proper 404 Not Found Page */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
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
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AuthProvider>
  );
}
