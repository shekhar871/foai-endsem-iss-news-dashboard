import { useEffect, useMemo } from 'react'
import { useLocalStorageState } from './useLocalStorageState'

export type ThemeMode = 'light' | 'dark'

const STORAGE_KEY = 'foai.theme'

export function useTheme() {
  const [theme, setTheme] = useLocalStorageState<ThemeMode>(STORAGE_KEY, 'light')
  const isDark = theme === 'dark'

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  }, [theme])

  return useMemo(
    () => ({
      theme,
      isDark,
      setTheme,
    }),
    [theme, isDark, setTheme],
  )
}

