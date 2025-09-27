import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from '../context/ThemeContext'
import '@fontsource/inter';        // 400
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';

import '@fontsource/montserrat';   // 400
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/700.css';

import './index.css';

// Ensure dark mode is always applied
document.documentElement.classList.add('dark');
document.documentElement.classList.remove('light');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
