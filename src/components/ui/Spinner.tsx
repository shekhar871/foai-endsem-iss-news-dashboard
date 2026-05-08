import { RefreshCcw } from 'lucide-react'

export function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return <RefreshCcw className={`${className} animate-spin`} />
}

