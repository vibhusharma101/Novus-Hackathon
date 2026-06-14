'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useRouter } from 'next/navigation'
import { Sparkles, X, ArrowUp, ShoppingCart, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const AGENT_ID = 'PENDO_AGENT_REMOVED'

const BUY_RE = /\[\[buy:([a-zA-Z0-9-]+)\]\]/g

const SUGGESTIONS = [
  'What should I buy to close my deficit?',
  'Cheapest rigid plastic credits?',
  'Summarize my compliance status',
]

// Splits assistant text into renderable segments, turning [[buy:<id>]] markers
// into checkout buttons.
function renderText(text: string, onBuy: (id: string) => void) {
  const out: React.ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  BUY_RE.lastIndex = 0
  let key = 0
  while ((m = BUY_RE.exec(text)) !== null) {
    if (m.index > last) out.push(<span key={key++}>{text.slice(last, m.index)}</span>)
    const id = m[1]
    out.push(
      <button
        key={key++}
        type="button"
        onClick={() => onBuy(id)}
        className="inline-flex items-center gap-1 my-1 bg-primary text-on-primary px-2.5 py-1 rounded font-data text-[11px] font-semibold hover:bg-primary-container transition-colors align-middle"
      >
        <ShoppingCart className="h-3 w-3" />
        Buy this
      </button>,
    )
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(<span key={key++}>{text.slice(last)}</span>)
  return out
}

export function CopilotPanel() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const conversationId = useRef(crypto.randomUUID()).current
  const prevStatusRef = useRef<string>('ready')

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: '/api/copilot' }),
  })

  const busy = status === 'submitted' || status === 'streaming'

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, open])

  // Track agent_response when streaming finishes
  useEffect(() => {
    const wasBusy = prevStatusRef.current === 'submitted' || prevStatusRef.current === 'streaming'
    if (wasBusy && status === 'ready' && messages.length > 0) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg.role === 'assistant') {
        let content = ''
        for (const part of lastMsg.parts) {
          if (part.type === 'text') content += part.text
        }
        window.pendo?.trackAgent('agent_response', {
          agentId: AGENT_ID,
          conversationId,
          messageId: lastMsg.id,
          content,
          modelUsed: 'claude-sonnet-4-6',
        })
      }
    }
    prevStatusRef.current = status
  }, [status, messages, conversationId])

  function submit(text: string, suggestedPrompt = false) {
    const t = text.trim()
    if (!t || busy) return
    window.pendo?.trackAgent('prompt', {
      agentId: AGENT_ID,
      conversationId,
      messageId: crypto.randomUUID(),
      content: t,
      suggestedPrompt,
    })
    sendMessage({ text: t })
    setInput('')
  }

  function goBuy(id: string) {
    setOpen(false)
    router.push(`/dashboard/checkout/${id}`)
  }

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          'fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95',
          open ? 'bg-inverse-surface text-white' : 'bg-primary text-on-primary hover:bg-primary-container',
        )}
        aria-label={open ? 'Close copilot' : 'Open EPRx Copilot'}
      >
        {open ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-40 w-[min(94vw,380px)] h-[min(70vh,560px)] bg-surface-container-lowest border border-[--color-border-zinc] rounded-xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[--color-border-zinc] bg-surface-container-low flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-['Geist'] text-sm font-semibold text-on-surface">EPRx Copilot</p>
              <p className="font-data text-[10px] text-on-surface-variant uppercase tracking-wide">Grounded in your live market</p>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-6">
                <p className="text-sm text-on-surface-variant mb-4">
                  Ask me what to buy to close your EPR deficit — I read your live liability and the active market.
                </p>
                <div className="space-y-2">
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => submit(s, true)}
                      className="block w-full text-left text-[13px] px-3 py-2 rounded-lg border border-[--color-border-zinc] hover:border-primary hover:bg-surface-container-low transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map(m => (
              <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed whitespace-pre-wrap',
                    m.role === 'user'
                      ? 'bg-primary text-on-primary rounded-br-sm'
                      : 'bg-surface-container text-on-surface rounded-bl-sm',
                  )}
                >
                  {m.parts.map((part, i) =>
                    part.type === 'text' ? <span key={i}>{m.role === 'assistant' ? renderText(part.text, goBuy) : part.text}</span> : null,
                  )}
                </div>
              </div>
            ))}

            {status === 'submitted' && (
              <div className="flex justify-start">
                <div className="bg-surface-container rounded-2xl rounded-bl-sm px-3.5 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-on-surface-variant" />
                </div>
              </div>
            )}

            {error && (
              <p className="text-[12px] text-[--color-risk-red] text-center">
                Something went wrong. Please try again.
              </p>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={e => { e.preventDefault(); submit(input) }}
            className="p-3 border-t border-[--color-border-zinc] flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask the copilot…"
              className="flex-1 h-10 px-3 rounded-lg border border-[--color-border-zinc] bg-surface-container-low text-[13px] outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="h-10 w-10 rounded-lg bg-primary text-on-primary flex items-center justify-center hover:bg-primary-container transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
            </button>
          </form>
        </div>
      )}
    </>
  )
}
