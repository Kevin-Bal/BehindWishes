import { createHashRouter } from 'react-router'
import { DiagnosticPage } from './pages/DiagnosticPage'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PlaceholderPage } from './pages/PlaceholderPage'

/**
 * Routage en mode hash (`/#/g/CODE/e/ID`) : GitHub Pages ne sait pas servir
 * les routes côté serveur. Routes cibles : voir docs/SPEC.md, section UX / UI.
 */
export const router = createHashRouter([
  { path: '/', element: <HomePage /> },
  { path: '/nouveau', element: <PlaceholderPage title="Créer un groupe" lot="lot 1" /> },
  { path: '/g/:code/*', element: <PlaceholderPage title="Ton groupe" lot="lot 1" /> },
  { path: '/diagnostic', element: <DiagnosticPage /> },
  { path: '*', element: <NotFoundPage /> },
])
