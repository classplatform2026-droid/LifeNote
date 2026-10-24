import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../lib/api.ts';
import {
  User,
  Settings,
  Moon,
  Sun,
  Shield,
  LogOut,
  Check,
  RefreshCw,
  Book,
  Type,
  KeyRound,
  UserCheck,
  X,
} from 'lucide-react';

interface SettingsPageProps {
  onOpenAuthModal: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onOpenAuthModal }) => {
  const { user, logout, updateUserName, updateUserPreferences } = useAuth();

  // Profile Edit State
  const [name, setName] = useState<string>(user?.name || '');
  const [isUpdatingName, setIsUpdatingName] = useState<boolean>(false);
  const [nameSuccess, setNameSuccess] = useState<boolean>(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState<boolean>(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Preferences State
  const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>(
    user?.preferences?.theme || 'light'
  );
  const [readingFont, setReadingFont] = useState<'serif' | 'sans'>(
    user?.preferences?.readingFont || 'serif'
  );
  const [defaultCover, setDefaultCover] = useState<'leather' | 'linen' | 'charcoal' | 'parchment'>(
    user?.preferences?.bookCover || 'leather'
  );

  React.useEffect(() => {
    document.title = 'Settings & Preferences | LifeNote AI';
  }, []);

  // Sync form states whenever user object updates from auth
  React.useEffect(() => {
    if (user?.name) setName(user.name);
    if (user?.preferences?.theme) setTheme(user.preferences.theme);
    if (user?.preferences?.readingFont) setReadingFont(user.preferences.readingFont);
    if (user?.preferences?.bookCover) setDefaultCover(user.preferences.bookCover);
  }, [user]);

  const handleSaveName = async () => {
    if (!name.trim()) return;
    try {
      setIsUpdatingName(true);
      await updateUserName(name.trim());
      setNameSuccess(true);
      setTimeout(() => setNameSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleUpdatePreferences = async (updates: any) => {
    try {
      await updateUserPreferences(updates);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    try {
      setIsUpdatingPassword(true);
      setPasswordMessage(null);
      await api.updatePassword({ currentPassword, newPassword });
      setPasswordMessage({ type: 'success', text: 'Password updated successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="min-h-full pb-24 pt-6 px-4 md:px-8 max-w-4xl mx-auto">
      {/* Editorial Header */}
      <div className="pb-6 border-b border-neutral-200 dark:border-neutral-800">
        <span className="text-xs uppercase tracking-widest font-mono text-neutral-500 dark:text-neutral-400 block mb-1">
          Preferences & Security
        </span>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-neutral-900 dark:text-white tracking-tight">
          Settings & Account
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          Manage your personal profile, reading typography, aesthetic themes, and authentication security.
        </p>
      </div>

      <div className="mt-8 space-y-10">
        {/* Section 1: Profile & Identity */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 md:p-8 shadow-xs">
          <div className="flex items-center gap-3 pb-4 mb-6 border-b border-neutral-200 dark:border-neutral-800">
            <div className="w-9 h-9 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
                Account Profile
              </h2>
              <p className="text-xs text-neutral-500 font-mono">
                {user?.email || 'No email attached'}
              </p>
            </div>
          </div>

          <div className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Full Name</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-neutral-500"
                />
                <button
                  onClick={handleSaveName}
                  disabled={isUpdatingName}
                  className="px-4 py-2 text-xs font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5 shrink-0"
                >
                  {isUpdatingName ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : nameSuccess ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : null}
                  <span>{nameSuccess ? 'Saved' : 'Save'}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">
                Account Email (User Isolation Identifier)
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 text-xs bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-500 cursor-not-allowed font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Workspace & Reading Preferences */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 md:p-8 shadow-xs">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white pb-4 mb-6 border-b border-neutral-200 dark:border-neutral-800">
            Aesthetic & Reading Experience
          </h2>

          <div className="space-y-6 max-w-lg">
            {/* Color Palette Theme */}
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-2">
                Interface Palette
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'light', label: 'Paper Light', icon: Sun },
                  { key: 'dark', label: 'Obsidian Dark', icon: Moon },
                  { key: 'sepia', label: 'Warm Sepia', icon: Book },
                ].map((th) => {
                  const Icon = th.icon;
                  const isSelected = theme === th.key;
                  return (
                    <button
                      key={th.key}
                      onClick={() => {
                        setTheme(th.key as any);
                        handleUpdatePreferences({ theme: th.key });
                      }}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                        isSelected
                          ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900 shadow-xs'
                          : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100'
                      }`}
                    >
                      <Icon className="w-4 h-4 mb-1.5" />
                      <span>{th.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reading Font */}
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-2">
                Default Reading Typography
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setReadingFont('serif');
                    handleUpdatePreferences({ readingFont: 'serif' });
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs text-center font-serif transition-all ${
                    readingFont === 'serif'
                      ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900 font-bold'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  Book Serif (Editorial)
                </button>
                <button
                  onClick={() => {
                    setReadingFont('sans');
                    handleUpdatePreferences({ readingFont: 'sans' });
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs text-center font-sans transition-all ${
                    readingFont === 'sans'
                      ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900 font-bold'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  Neo-Grotesque Sans
                </button>
              </div>
            </div>

            {/* Default Cover Texture */}
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-2">
                Preferred Book Cover Style
              </label>
              <select
                value={defaultCover}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setDefaultCover(val);
                  handleUpdatePreferences({ bookCover: val });
                }}
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg"
              >
                <option value="leather">Textured Leather (Gold Debossed)</option>
                <option value="linen">Natural Woven Linen Cloth</option>
                <option value="charcoal">Charcoal Slate Buckram</option>
                <option value="parchment">Classical Aged Parchment</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Password & Security */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 md:p-8 shadow-xs">
          <div className="flex items-center gap-2 pb-4 mb-6 border-b border-neutral-200 dark:border-neutral-800">
            <KeyRound className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              Password Security
            </h2>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
            {passwordMessage && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center justify-between ${
                  passwordMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800'
                }`}
              >
                <span>{passwordMessage.text}</span>
                <button
                  type="button"
                  onClick={() => setPasswordMessage(null)}
                  className="p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">
                New Password (minimum 6 characters)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="px-4 py-2 text-xs font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              {isUpdatingPassword ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Update Password</span>
            </button>
          </form>
        </div>

        {/* Section 4: Session Management & Sign Out */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 md:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              Account Session
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Securely sign out of this device or switch to a different workspace profile.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAuthModal}
              className="px-4 py-2 text-xs font-medium border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Switch Account</span>
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
