import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './db'
import { startCloudSync } from './firebase/boot'
import { bootThemeFromDb } from './theme'

startCloudSync()
void bootThemeFromDb()

startCloudSync()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
