/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NEWS_API_KEY?: string
  readonly VITE_AI_TOKEN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

