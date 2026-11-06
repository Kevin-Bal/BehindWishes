import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { OfflineBanner } from './components/OfflineBanner'
import { AuthProvider } from './lib/auth'
import { applyTransparency } from './lib/preferences'
import { router } from './router'
import './styles/index.css'

applyTransparency()

const root = document.getElementById('root')
if (!root) throw new Error('Élément #root introuvable')

createRoot(root).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
      <OfflineBanner />
    </AuthProvider>
  </StrictMode>,
)
