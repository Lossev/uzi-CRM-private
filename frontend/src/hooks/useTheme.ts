import { useState, useEffect } from 'react'

type Theme = 'light' | 'dark' | 'warm'
type WarmVariant = 1 | 2 | 3 | 4 | 5

const themeClasses: Record<Theme, string> = {
  light: '',
  dark: 'dark',
  warm: 'warm',
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme') as Theme
      if (stored && ['light', 'dark', 'warm'].includes(stored)) return stored
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  })

  const [warmVariant, setWarmVariant] = useState<WarmVariant>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('warmVariant')
      if (stored) {
        const num = parseInt(stored)
        if ([1, 2, 3, 4, 5].includes(num)) return num as WarmVariant
      }
    }
    return 3
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('dark', 'warm-1', 'warm-2', 'warm-3', 'warm-4', 'warm-5')
    
    if (theme === 'warm') {
      root.classList.add(`warm-${warmVariant}`)
    } else if (themeClasses[theme]) {
      root.classList.add(themeClasses[theme])
    }
    
    localStorage.setItem('theme', theme)
    localStorage.setItem('warmVariant', String(warmVariant))
  }, [theme, warmVariant])

  const cycleTheme = () => {
    setTheme(prev => {
      if (prev === 'light') return 'warm'
      if (prev === 'warm') return 'dark'
      return 'light'
    })
  }

  return { theme, setTheme, cycleTheme, warmVariant, setWarmVariant }
}
