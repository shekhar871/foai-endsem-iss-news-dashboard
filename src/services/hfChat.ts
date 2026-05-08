import { fetchJson } from '../lib/fetchJson'

type HfTextGenerationResponse =
  | Array<{ generated_text?: string }>
  | { generated_text?: string; error?: string }

export async function mistralDashboardChat(prompt: string) {
  const token = import.meta.env.VITE_AI_TOKEN
  if (!token) throw new Error('Missing VITE_AI_TOKEN in .env')

  const url = 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2'

  const res = await fetchJson<HfTextGenerationResponse>(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: 220,
        temperature: 0.2,
        return_full_text: false,
      },
      options: { wait_for_model: true },
    }),
  })

  const text =
    Array.isArray(res) ? (res[0]?.generated_text ?? '') : (res.generated_text ?? '')

  if (!text.trim()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = (res as any)?.error
    throw new Error(err ? String(err) : 'Empty model response')
  }

  return text.trim()
}

