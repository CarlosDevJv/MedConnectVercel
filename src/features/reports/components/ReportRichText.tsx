import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import * as React from 'react'

import { cn } from '@/lib/cn'

export interface ReportRichTextProps {
  /** Ex.: `${report.id}:${report.updated_at}` — quando mudar, o corpo é sincronizado com a API. */
  syncToken: string
  initialJson: Record<string, unknown> | null
  initialHtml: string | null
  editable?: boolean
  onBodyChange: (html: string, json: Record<string, unknown>) => void
  className?: string
}

export function ReportRichText({
  syncToken,
  initialJson,
  initialHtml,
  editable = true,
  onBodyChange,
  className,
}: ReportRichTextProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p></p>',
    editable,
    editorProps: {
      attributes: {
        class: cn(
          'report-tiptap',
          'min-h-[280px] px-4 py-3 text-sm text-[var(--color-foreground)] outline-none',
          '[&_h1]:font-display [&_h1]:text-xl [&_h1]:font-medium [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-medium',
          '[&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5'
        ),
      },
    },
    onUpdate: ({ editor: ed }) => {
      onBodyChange(ed.getHTML(), ed.getJSON() as Record<string, unknown>)
    },
  })

  const contentSnap = React.useMemo(
    () =>
      `${syncToken}|${initialHtml ?? ''}|${initialJson ? JSON.stringify(initialJson) : ''}`,
    [syncToken, initialHtml, initialJson]
  )
  const lastSnapRef = React.useRef<string>('')

  React.useEffect(() => {
    if (!editor || !syncToken) return
    if (lastSnapRef.current === contentSnap) return
    lastSnapRef.current = contentSnap
    const next = (initialJson as object | null) ?? initialHtml ?? '<p></p>'
    editor.commands.setContent(next, { emitUpdate: false })
  }, [editor, syncToken, contentSnap, initialJson, initialHtml])

  React.useEffect(() => {
    if (editor) editor.setEditable(editable)
  }, [editor, editable])

  if (!editor) {
    return (
      <div
        className={cn(
          'min-h-[280px] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-muted)]/30',
          className
        )}
        aria-hidden
      />
    )
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]',
        !editable && 'opacity-90',
        className
      )}
    >
      <EditorContent editor={editor} />
    </div>
  )
}
