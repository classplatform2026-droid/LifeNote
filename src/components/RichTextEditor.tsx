import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo,
  Redo,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  minHeight?: string;
  isAIProcessing?: boolean;
  aiProcessingLabel?: string;
  wasAIApplied?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = 'Begin writing your thoughts...',
  readOnly = false,
  minHeight = '220px',
  isAIProcessing = false,
  aiProcessingLabel = 'AI is actively polishing your writing...',
  wasAIApplied = false,
}) => {
  const [processingStep, setProcessingStep] = useState<number>(0);

  const steps = [
    'Analyzing authorial tone & context...',
    'Refining vocabulary & syntax...',
    'Harmonizing paragraph cadence...',
    'Finalizing semantic improvements...',
  ];

  useEffect(() => {
    if (!isAIProcessing) {
      setProcessingStep(0);
      return;
    }
    const interval = setInterval(() => {
      setProcessingStep((prev) => (prev + 1) % steps.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [isAIProcessing]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editable: !readOnly && !isAIProcessing,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `prose prose-neutral max-w-none focus:outline-none text-neutral-800 dark:text-neutral-200 leading-relaxed text-sm md:text-base py-1.5`,
      },
    },
  });

  // Keep editor content in sync when external content changes (e.g. AI approved or entry loaded)
  useEffect(() => {
    if (editor && content !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(content || '');
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div
        className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 animate-pulse"
        style={{ minHeight }}
      />
    );
  }

  return (
    <div
      className={`relative w-full border rounded-xl bg-white dark:bg-neutral-900 overflow-hidden shadow-xs transition-all duration-300 ${
        isAIProcessing
          ? 'animate-ai-glow border-amber-500/80 ring-2 ring-amber-500/30'
          : 'border-neutral-200 dark:border-neutral-800 focus-within:border-neutral-400 dark:focus-within:border-neutral-600'
      }`}
    >
      {/* Compact flex toolbar */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/80 text-neutral-600 dark:text-neutral-400 text-xs">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors ${
              editor.isActive('bold') ? 'bg-neutral-200 text-neutral-950 font-bold dark:bg-neutral-800 dark:text-white' : ''
            }`}
            title="Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors ${
              editor.isActive('italic') ? 'bg-neutral-200 text-neutral-950 dark:bg-neutral-800 dark:text-white' : ''
            }`}
            title="Italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-3.5 bg-neutral-300 dark:bg-neutral-700 mx-1" />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-1.5 py-0.5 rounded font-serif font-bold text-xs hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors ${
              editor.isActive('heading', { level: 2 }) ? 'bg-neutral-200 text-neutral-950 dark:bg-neutral-800 dark:text-white' : ''
            }`}
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`px-1.5 py-0.5 rounded font-serif font-semibold text-xs hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors ${
              editor.isActive('heading', { level: 3 }) ? 'bg-neutral-200 text-neutral-950 dark:bg-neutral-800 dark:text-white' : ''
            }`}
            title="Heading 3"
          >
            H3
          </button>

          <span className="w-px h-3.5 bg-neutral-300 dark:bg-neutral-700 mx-1" />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors ${
              editor.isActive('bulletList') ? 'bg-neutral-200 text-neutral-950 dark:bg-neutral-800 dark:text-white' : ''
            }`}
            title="Bullet List"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors ${
              editor.isActive('orderedList') ? 'bg-neutral-200 text-neutral-950 dark:bg-neutral-800 dark:text-white' : ''
            }`}
            title="Numbered List"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors ${
              editor.isActive('blockquote') ? 'bg-neutral-200 text-neutral-950 dark:bg-neutral-800 dark:text-white' : ''
            }`}
            title="Quote"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
            title="Divider"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-3.5 bg-neutral-300 dark:bg-neutral-700 mx-1 ml-auto" />

          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 disabled:opacity-30 transition-colors"
            title="Undo"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 disabled:opacity-30 transition-colors"
            title="Redo"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Editor Content Box with AI Animation Layers */}
      <div
        className={`relative p-3.5 transition-all ${
          wasAIApplied ? 'animate-ai-applied' : ''
        }`}
        style={{ minHeight }}
      >
        {/* Animated AI Scanning Light Beam */}
        {isAIProcessing && (
          <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_20px_rgba(251,191,36,1)] pointer-events-none z-20 animate-ai-scan" />
        )}

        {/* AI Processing Overlay HUD */}
        {isAIProcessing && (
          <div className="absolute inset-0 bg-white/75 dark:bg-neutral-950/75 backdrop-blur-xs z-10 flex flex-col items-center justify-center p-4 transition-all">
            <div className="relative mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 animate-ai-orb shadow-[0_0_25px_rgba(245,158,11,0.5)]">
                <div className="w-full h-full bg-neutral-900 rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-amber-300 animate-spin" />
                </div>
              </div>
              <span className="absolute -inset-1 rounded-full border-2 border-amber-400/40 animate-ping pointer-events-none" />
            </div>

            <div className="ai-shimmer-badge text-white px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2 text-xs font-semibold">
              <span className="font-mono text-amber-300">AI WORKSPACE</span>
              <span className="text-neutral-400">·</span>
              <span>{aiProcessingLabel}</span>
            </div>

            {/* Live Changing Status Step with Typing Dots */}
            <div className="flex items-center gap-2 mt-3 text-xs text-neutral-700 dark:text-neutral-300 font-mono">
              <span>{steps[processingStep]}</span>
              <div className="flex items-center gap-0.5">
                <span className="w-1 h-1 rounded-full bg-amber-500 ai-typing-dot-1" />
                <span className="w-1 h-1 rounded-full bg-amber-500 ai-typing-dot-2" />
                <span className="w-1 h-1 rounded-full bg-amber-500 ai-typing-dot-3" />
              </div>
            </div>
          </div>
        )}

        {/* AI Applied Success Toast Flash */}
        {wasAIApplied && (
          <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 rounded-lg text-xs font-medium text-amber-900 dark:text-amber-200 shadow-md animate-in fade-in slide-in-from-top-2 duration-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>AI Refinements Applied</span>
          </div>
        )}

        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
