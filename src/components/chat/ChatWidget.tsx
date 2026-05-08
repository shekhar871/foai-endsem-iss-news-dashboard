import { MessageCircle, Trash2, X } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocalStorageState } from '../../hooks/useLocalStorageState'
import type { IssState, NewsArticle, NewsState } from '../../types/dashboard'
import { mistralDashboardChat } from '../../services/hfChat'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  ts: number
}

const STORAGE_KEY = 'foai.chat.messages'

function buildDashboardContext(iss: IssState, news: NewsState & { totalArticles: number; visibleArticles: NewsArticle[] }) {
  const latest = iss.latest
  const issContext = latest
    ? {
        latitude: latest.latitude,
        longitude: latest.longitude,
        speedKmh: latest.speedKmh,
        nearestPlace: latest.nearestPlace,
        trackedPositions: iss.positions.length,
        timestamp: new Date(latest.timestampMs).toISOString(),
      }
    : null

  const topNews = news.visibleArticles.slice(0, 10).map((a) => ({
    category: a.category,
    title: a.title,
    source: a.source,
    author: a.author,
    publishedAt: a.publishedAt,
    description: a.description,
    url: a.url,
  }))

  return {
    iss: issContext,
    peopleInSpace: iss.peopleInSpace ? { count: iss.peopleInSpace.count, names: iss.peopleInSpace.names } : null,
    news: {
      totalArticles: news.totalArticles,
      filterCategory: news.filterCategory,
      searchQuery: news.searchQuery,
      sortBy: news.sortBy,
      items: topNews,
    },
  }
}

function systemPrompt(contextJson: string) {
  return [
    'You are the dashboard assistant.',
    'CRITICAL RULES:',
    '- You can ONLY answer using the JSON dashboard data provided below.',
    "- If the answer is not present in the data, reply exactly: \"I only know dashboard data.\"",
    '- Do not use outside knowledge. Do not guess. Do not browse the internet.',
    '- Keep answers short, factual, and directly tied to the data.',
    '',
    'DASHBOARD_JSON:',
    contextJson,
    '',
    'Now answer the user question.',
  ].join('\n')
}

export function ChatWidget({
  iss,
  news,
}: {
  iss: IssState
  news: NewsState & { totalArticles: number; visibleArticles: NewsArticle[] }
}) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useLocalStorageState<ChatMessage[]>(STORAGE_KEY, [])
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const listRef = useRef<HTMLDivElement | null>(null)

  const trimmed = draft.trim()
  const canSend = trimmed.length > 0 && !typing

  const contextJson = useMemo(() => JSON.stringify(buildDashboardContext(iss, news)), [iss, news])

  const scrollToBottom = () => {
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }

  const pushMessage = (m: ChatMessage) => {
    setMessages((prev) => {
      const next = [...prev, m].slice(-30)
      return next
    })
    setTimeout(scrollToBottom, 0)
  }

  const send = async () => {
    if (!canSend) return
    const content = trimmed
    setDraft('')
    const now = Date.now()
    pushMessage({ id: `${now}-u`, role: 'user', content, ts: now })

    setTyping(true)
    try {
      const prompt = `${systemPrompt(contextJson)}\n\nUSER_QUESTION: ${content}`
      const answer = await mistralDashboardChat(prompt)
      pushMessage({ id: `${Date.now()}-a`, role: 'assistant', content: answer, ts: Date.now() })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Chat failed'
      toast.error(msg)
      pushMessage({
        id: `${Date.now()}-aerr`,
        role: 'assistant',
        content: 'I only know dashboard data.',
        ts: Date.now(),
      })
    } finally {
      setTyping(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className="fixed bottom-5 right-5 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700"
        onClick={() => setOpen((v) => !v)}
        title="AI Assistant"
      >
        <MessageCircle className="h-5 w-5" />
      </button>

      {open ? (
        <div className="fixed bottom-20 right-5 z-50 w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between gap-2 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
            <div>
              <div className="text-sm font-semibold">AI Assistant</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Answers from dashboard data only</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="btn"
                type="button"
                onClick={() => {
                  setMessages([])
                  toast.success('Chat cleared')
                }}
                title="Clear chat"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button className="btn" type="button" onClick={() => setOpen(false)} title="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div ref={listRef} className="max-h-[360px] overflow-auto px-3 py-3">
            {messages.length ? (
              <div className="space-y-2">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-snug ${
                        m.role === 'user'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100'
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                {typing ? (
                  <div className="flex justify-start">
                    <div className="rounded-2xl bg-zinc-100 px-3 py-2 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                      Assistant is typing…
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-200 bg-white p-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                Ask about ISS location/speed, number of news articles, or summaries from the loaded headlines.
              </div>
            )}
          </div>

          <div className="border-t border-zinc-100 p-3 dark:border-zinc-800">
            <div className="flex items-end gap-2">
              <textarea
                className="input min-h-[44px] flex-1 resize-none"
                rows={2}
                placeholder="Ask from dashboard data only…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void send()
                  }
                }}
              />
              <button className="btn btn-primary" type="button" disabled={!canSend} onClick={() => void send()}>
                Send
              </button>
            </div>
            <div className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
              Stored locally: last 30 messages
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

