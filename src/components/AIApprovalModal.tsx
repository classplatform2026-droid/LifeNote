import React, { useState } from 'react';
import { Check, X, Sparkles, ArrowRight, Eye, RefreshCw, Wand2, CheckCircle2, Globe } from 'lucide-react';

interface AIApprovalModalProps {
  isOpen: boolean;
  title: string;
  summary?: string;
  language?: 'bangla' | 'english' | 'unique' | string;
  originalContent: string;
  suggestedContent: string;
  onApprove: () => Promise<void>;
  onReject: () => void;
  isSaving?: boolean;
}

export const AIApprovalModal: React.FC<AIApprovalModalProps> = ({
  isOpen,
  title,
  summary,
  language,
  originalContent,
  suggestedContent,
  onApprove,
  onReject,
  isSaving = false,
}) => {
  const [viewMode, setViewMode] = useState<'split' | 'suggested' | 'original'>('split');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Compact Flex Header */}
        <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/70 dark:bg-neutral-900/70 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                  {title}
                </h3>
                {language && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300/40">
                    <Globe className="w-2.5 h-2.5" />
                    {language === 'bangla' ? '🇧🇩 বাংলা' : language === 'english' ? '🇬🇧 English' : '✨ Unique Blend'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                AI proposed refinements ready for your review and approval.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center bg-neutral-200/60 dark:bg-neutral-800 p-0.5 rounded-lg text-xs font-medium">
              <button
                onClick={() => setViewMode('split')}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  viewMode === 'split'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                Split
              </button>
              <button
                onClick={() => setViewMode('suggested')}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  viewMode === 'suggested'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                Suggested
              </button>
              <button
                onClick={() => setViewMode('original')}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  viewMode === 'original'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                Original
              </button>
            </div>

            <button
              onClick={onReject}
              disabled={isSaving}
              className="p-1 rounded-lg hover:bg-neutral-200/60 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Compact Changes Summary Banner */}
        {summary && (
          <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200">
            <span className="font-semibold shrink-0 flex items-center gap-1 font-mono">
              <Wand2 className="w-3.5 h-3.5 text-amber-500" />
              AI Changes:
            </span>
            <span className="truncate">{summary}</span>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {viewMode === 'split' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
              {/* Original */}
              <div className="flex flex-col border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 bg-neutral-50/50 dark:bg-neutral-900/50">
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-neutral-200 dark:border-neutral-800">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    Current Version
                  </span>
                </div>
                <div
                  className="prose prose-neutral dark:prose-invert max-w-none text-xs md:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed flex-1 overflow-y-auto max-h-[340px]"
                  dangerouslySetInnerHTML={{ __html: originalContent || '<p><em>Empty</em></p>' }}
                />
              </div>

              {/* AI Proposed with Lively Glowing Animation */}
              <div className="flex flex-col border border-amber-400/60 dark:border-amber-400/50 rounded-xl p-3 bg-amber-50/20 dark:bg-neutral-800/60 ring-2 ring-amber-400/20 shadow-sm animate-ai-glow">
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-amber-300/50 dark:border-neutral-700">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-500 animate-spin" />
                    AI Refined Proposal
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                    Ready to Apply
                  </span>
                </div>
                <div
                  className="prose prose-neutral dark:prose-invert max-w-none text-xs md:text-sm text-neutral-900 dark:text-neutral-100 leading-relaxed flex-1 overflow-y-auto max-h-[340px]"
                  dangerouslySetInnerHTML={{ __html: suggestedContent }}
                />
              </div>
            </div>
          ) : viewMode === 'suggested' ? (
            <div className="border border-amber-400/60 rounded-xl p-4 bg-white dark:bg-neutral-900 animate-ai-glow">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5 mb-3">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                AI Refinement Preview
              </span>
              <div
                className="prose prose-neutral dark:prose-invert max-w-none text-sm text-neutral-900 dark:text-neutral-100 leading-relaxed max-h-[360px] overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: suggestedContent }}
              />
            </div>
          ) : (
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 bg-white dark:bg-neutral-900">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 block mb-3">
                Current Original Content
              </span>
              <div
                className="prose prose-neutral dark:prose-invert max-w-none text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed max-h-[360px] overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: originalContent || '<p><em>Empty</em></p>' }}
              />
            </div>
          )}
        </div>

        {/* Compact Footer with explicit Approval & Dismiss */}
        <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/70 dark:bg-neutral-900/70">
          <p className="text-[11px] text-neutral-500 hidden sm:block">
            Permanent changes will only be saved upon approval.
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onReject}
              disabled={isSaving}
              className="px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg border border-neutral-200 dark:border-neutral-800 transition-colors"
            >
              Keep Original
            </button>
            <button
              onClick={onApprove}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg text-xs font-medium hover:opacity-90 transition-all shadow-xs"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Applying Changes...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve & Apply AI Edits</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
