'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { useEffect, useState } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo2,
  Redo2,
  Eraser,
  Sparkles,
  Wand2,
  FileText,
  Code,
  AlertCircle,
  CheckCircle2,
  LucideIcon,
} from 'lucide-react';
import { Spinner } from '@/components/PortalLoader';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  showAIAssistant?: boolean;
  /** `light` for the candidate/employer portals, `dark` for the admin console. */
  variant?: 'light' | 'dark';
}

type Tool = { icon: LucideIcon; label: string; run: (e: Editor) => void; active?: (e: Editor) => boolean; disabled?: (e: Editor) => boolean; danger?: boolean };

const TOOL_GROUPS: Tool[][] = [
  [
    { icon: Bold, label: 'Bold', run: (e) => e.chain().focus().toggleBold().run(), active: (e) => e.isActive('bold') },
    { icon: Italic, label: 'Italic', run: (e) => e.chain().focus().toggleItalic().run(), active: (e) => e.isActive('italic') },
    { icon: Strikethrough, label: 'Strikethrough', run: (e) => e.chain().focus().toggleStrike().run(), active: (e) => e.isActive('strike') },
  ],
  [
    { icon: Heading2, label: 'Heading', run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(), active: (e) => e.isActive('heading', { level: 2 }) },
    { icon: Heading3, label: 'Subheading', run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(), active: (e) => e.isActive('heading', { level: 3 }) },
  ],
  [
    { icon: List, label: 'Bullet list', run: (e) => e.chain().focus().toggleBulletList().run(), active: (e) => e.isActive('bulletList') },
    { icon: ListOrdered, label: 'Numbered list', run: (e) => e.chain().focus().toggleOrderedList().run(), active: (e) => e.isActive('orderedList') },
  ],
  [
    { icon: Quote, label: 'Quote', run: (e) => e.chain().focus().toggleBlockquote().run(), active: (e) => e.isActive('blockquote') },
    { icon: Code, label: 'Code block', run: (e) => e.chain().focus().toggleCodeBlock().run(), active: (e) => e.isActive('codeBlock') },
    { icon: Minus, label: 'Divider', run: (e) => e.chain().focus().setHorizontalRule().run() },
  ],
  [
    { icon: Eraser, label: 'Clear formatting', run: (e) => e.chain().focus().clearNodes().unsetAllMarks().run(), danger: true },
    { icon: Undo2, label: 'Undo', run: (e) => e.chain().focus().undo().run(), disabled: (e) => !e.can().undo() },
    { icon: Redo2, label: 'Redo', run: (e) => e.chain().focus().redo().run(), disabled: (e) => !e.can().redo() },
  ],
];

const AI_ACTIONS = [
  { mode: 'proofread' as const, label: 'Fix grammar', icon: Wand2, done: 'Spelling and grammar fixed.' },
  { mode: 'expand' as const, label: 'Expand', icon: Sparkles, done: 'Description expanded.' },
  { mode: 'summarize' as const, label: 'Make a checklist', icon: FileText, done: 'Converted into bullet points.' },
];

const THEMES = {
  light: {
    shell: 'border-slate-200 bg-white focus-within:border-brand-navy/40 focus-within:ring-4 focus-within:ring-brand-navy/[0.06]',
    toolbar: 'border-slate-100 bg-slate-50/70',
    divider: 'bg-slate-200',
    tool: 'text-slate-500 hover:bg-white hover:text-brand-navy hover:shadow-sm',
    toolActive: 'bg-brand-navy text-white shadow-sm',
    toolDanger: 'text-slate-500 hover:bg-rose-50 hover:text-rose-600',
    aiBar: 'border-slate-100 bg-white',
    aiLabel: 'text-slate-600',
    aiIcon: 'text-brand-navy',
    aiButton: 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-brand-navy',
    error: 'border-rose-100 bg-rose-50 text-rose-700',
    success: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    overlay: 'bg-white/80 text-slate-500',
    prose: 'prose prose-slate prose-sm sm:prose-base text-slate-700 prose-headings:text-brand-navy prose-a:text-brand-navy',
    loading: 'border-slate-200 bg-white text-slate-400',
  },
  dark: {
    shell: 'border-white/[0.08] bg-ink-950/60 focus-within:border-brand-lime/50 focus-within:ring-4 focus-within:ring-brand-lime/10',
    toolbar: 'border-white/[0.06] bg-white/[0.02]',
    divider: 'bg-white/10',
    tool: 'text-slate-400 hover:bg-white/[0.06] hover:text-white',
    toolActive: 'bg-brand-lime text-brand-navy',
    toolDanger: 'text-slate-400 hover:bg-rose-500/10 hover:text-rose-300',
    aiBar: 'border-white/[0.06] bg-white/[0.02]',
    aiLabel: 'text-slate-300',
    aiIcon: 'text-brand-lime',
    aiButton: 'border-white/10 text-slate-300 hover:bg-white/[0.06] hover:text-white',
    error: 'border-rose-500/20 bg-rose-500/10 text-rose-200',
    success: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
    overlay: 'bg-ink-950/80 text-slate-400',
    prose: 'prose prose-invert prose-sm sm:prose-base text-slate-200',
    loading: 'border-white/[0.08] bg-ink-950/60 text-slate-500',
  },
};

export default function RichTextEditor({ content, onChange, showAIAssistant = false, variant = 'light' }: RichTextEditorProps) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccess, setAiSuccess] = useState<string | null>(null);
  const t = THEMES[variant];

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: { class: 'rounded-xl max-w-full min-w-[200px] h-auto my-4 mx-auto' },
        allowBase64: true,
      }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: `${t.prose} max-w-none focus:outline-none px-5 py-4 min-h-[300px] leading-relaxed prose-img:rounded-xl`,
      },
    },
  });

  // Update editor content when external content changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className={`flex h-64 items-center justify-center rounded-xl border ${t.loading}`}>
        <Spinner className="h-5 w-5" />
      </div>
    );
  }

  const handleAIRewrite = async (mode: (typeof AI_ACTIONS)[number]['mode']) => {
    const currentHtml = editor.getHTML();
    if (!currentHtml || currentHtml === '<p></p>') {
      setAiError('Write a few lines first so the assistant has something to work with.');
      return;
    }
    setAiLoading(true);
    setAiError(null);
    setAiSuccess(null);
    try {
      const response = await fetch('/api/superadmin/ai-rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ htmlContent: currentHtml, mode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'The assistant couldn’t rewrite this text.');
      if (!data.rewritten) throw new Error('The assistant returned no text. Please try again.');
      editor.commands.setContent(data.rewritten);
      onChange(data.rewritten);
      setAiSuccess(AI_ACTIONS.find((a) => a.mode === mode)!.done);
      setTimeout(() => setAiSuccess(null), 4000);
    } catch (err: any) {
      console.error('[RichTextEditor AI] error:', err);
      setAiError(err.message || 'The assistant is unavailable right now. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className={`overflow-hidden rounded-xl border transition-all ${t.shell}`}>
      <div className={`flex flex-wrap items-center gap-1 border-b p-1.5 select-none ${t.toolbar}`} role="toolbar" aria-label="Formatting">
        {TOOL_GROUPS.map((group, gi) => (
          <div key={gi} className="flex items-center gap-0.5">
            {gi > 0 && <span className={`mx-1 h-5 w-px ${t.divider}`} />}
            {group.map(({ icon: Icon, label, run, active, disabled, danger }) => {
              const isActive = active?.(editor);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => run(editor)}
                  disabled={disabled?.(editor)}
                  title={label}
                  aria-label={label}
                  aria-pressed={active ? isActive : undefined}
                  className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-all disabled:cursor-not-allowed disabled:opacity-30 ${
                    isActive ? t.toolActive : danger ? t.toolDanger : t.tool
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {showAIAssistant && (
        <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2 text-xs ${t.aiBar}`}>
          <span className={`flex items-center gap-1.5 font-medium ${t.aiLabel}`}>
            <Sparkles className={`h-3.5 w-3.5 ${t.aiIcon}`} /> Writing assistant
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {AI_ACTIONS.map(({ mode, label, icon: Icon }) => (
              <button
                key={mode}
                type="button"
                disabled={aiLoading}
                onClick={() => handleAIRewrite(mode)}
                className={`flex h-7 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 font-medium transition-colors disabled:opacity-40 ${t.aiButton}`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {aiError && (
        <div role="alert" className={`flex items-center gap-2 border-b px-4 py-2 text-xs ${t.error}`}>
          <AlertCircle className="h-4 w-4 shrink-0" />
          {aiError}
        </div>
      )}
      {aiSuccess && (
        <div role="status" className={`flex items-center gap-2 border-b px-4 py-2 text-xs ${t.success}`}>
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {aiSuccess}
        </div>
      )}

      <div className="relative min-h-[300px]">
        {aiLoading && (
          <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-2.5 backdrop-blur-[1px] ${t.overlay}`}>
            <Spinner className="h-5 w-5" />
            <p className="text-xs">Rewriting…</p>
          </div>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
