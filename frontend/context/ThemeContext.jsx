import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  console.log('Theme context accessed:', context)
  return context
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check localStorage first, then system preference
    const savedTheme = localStorage.getItem('theme')
    console.log('Saved theme from localStorage:', savedTheme)
    
    if (savedTheme) {
      return savedTheme
    }
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      console.log('System prefers dark mode')
      return 'dark'
    }
    
    console.log('Defaulting to light mode')
    return 'light'
  })

  useEffect(() => {
    console.log('Theme changed to:', theme)
    
    // Save to localStorage
    localStorage.setItem('theme', theme)
    
    // Apply theme class to document
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    
    console.log('Applied theme class to document:', theme)
  }, [theme])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    console.log('Toggling theme from', theme, 'to', newTheme)
    setTheme(newTheme)
  }

  const setLightTheme = () => {
    console.log('Setting light theme')
    setTheme('light')
  }

  const setDarkTheme = () => {
    console.log('Setting dark theme')
    setTheme('dark')
  }

  const value = {
    theme,
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    isLight: theme === 'light',
    isDark: theme === 'dark'
  }

  console.log('ThemeProvider value:', value)

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export default ThemeContext