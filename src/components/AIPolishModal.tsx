import React, { useState, useEffect } from 'react';
import { Sparkles, X, Globe, Check, RefreshCw } from 'lucide-react';
import { AILanguage } from '../types/index.ts';

export interface AIPolishPreset {
  id: string;
  label: string;
  description?: string;
}

interface AIPolishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: { preset: string; customCommand: string; language: AILanguage }) => Promise<void> | void;
  isLoading?: boolean;
  title?: string;
  defaultPreset?: string;
  presets?: AIPolishPreset[];
  initialLanguage?: AILanguage;
  error?: string;
}

const DEFAULT_PRESETS: AIPolishPreset[] = [
  { id: 'polish', label: 'Polish & Flow', description: 'Enhance clarity, phrasing, and smooth flow' },
  { id: 'fix_grammar', label: 'Grammar & Syntax', description: 'Strict grammatical precision & spelling' },
  { id: 'poetic', label: 'Poetic & Expressive', description: 'Rich literary cadence and emotional depth' },
  { id: 'concise', label: 'Crisp & Concise', description: 'Cut fluff while preserving core meaning' },
  { id: 'structure', label: 'Structure & Organize', description: 'Clear sections, headings, and takeaways' },
];

export const AIPolishModal: React.FC<AIPolishModalProps> = ({
  isOpen,
  onClose,
  onApply,
  isLoading = false,
  title = 'AI Polish',
  defaultPreset = 'polish',
  presets = DEFAULT_PRESETS,
  initialLanguage = 'unique',
  error,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>(defaultPreset);
  const [customCommand, setCustomCommand] = useState<string>('');
  const [language, setLanguage] = useState<AILanguage>(initialLanguage);

  useEffect(() => {
    if (isOpen) {
      setSelectedPreset(defaultPreset);
      setCustomCommand('');
      setLanguage(initialLanguage);
    }
  }, [isOpen, defaultPreset, initialLanguage]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply({
      preset: selectedPreset,
      customCommand: customCommand.trim(),
      language,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl p-4 md:p-5 text-neutral-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/60 rounded-xl text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-3.5 space-y-3.5">
          {/* Language Selection */}
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
              <Globe className="w-3 h-3 text-neutral-400" />
              <span>Language Preference</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'unique' as AILanguage, label: '✨ Unique', sub: 'বাংলা + English' },
                { id: 'bangla' as AILanguage, label: '🇧🇩 বাংলা', sub: 'Pure Bengali' },
                { id: 'english' as AILanguage, label: '🇬🇧 English', sub: 'Pure English' },
              ].map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => setLanguage(lang.id)}
                  className={`p-1.5 rounded-lg border text-left transition-all ${
                    language === lang.id
                      ? 'border-neutral-900 dark:border-white bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs'
                      : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300'
                  }`}
                >
                  <div className="text-xs font-medium leading-none">{lang.label}</div>
                  <div className={`text-[9px] mt-0.5 truncate ${language === lang.id ? 'opacity-80' : 'text-neutral-400'}`}>
                    {lang.sub}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Preset Options */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
              Select Preset Focus
            </label>
            <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-0.5">
              {presets.map((preset) => {
                const isSelected = selectedPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedPreset(preset.id)}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 ring-1 ring-amber-500/30'
                        : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300'
                    }`}
                  >
                    <div className="text-xs font-medium leading-snug flex items-center justify-between">
                      <span>{preset.label}</span>
                      {isSelected && <Check className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />}
                    </div>
                    {preset.description && (
                      <p className="text-[10px] text-neutral-400 dark:text-neutral-500 line-clamp-1 mt-0.5">
                        {preset.description}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Command Input */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
              Custom Command (Optional)
            </label>
            <input
              type="text"
              value={customCommand}
              onChange={(e) => setCustomCommand(e.target.value)}
              placeholder="e.g. Translate into pure Bangla, or make tone humorous..."
              className="w-full px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg border border-neutral-200 dark:border-neutral-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg text-xs font-medium shadow-xs hover:opacity-90 active:scale-[0.98] transition-all"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Polishing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Apply Polish</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
