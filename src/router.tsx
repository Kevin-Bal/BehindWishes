import { createHashRouter } from 'react-router'
import { CreateGroupPage } from './pages/CreateGroupPage'
import { DiagnosticPage } from './pages/DiagnosticPage'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { EventFormPage } from './pages/group/EventFormPage'
import { EventPage } from './pages/group/EventPage'
import { GroupHomePage } from './pages/group/GroupHomePage'
import { GroupLayout } from './pages/group/GroupLayout'
import { MembersPage } from './pages/group/MembersPage'
import { ReservationsPage } from './pages/group/ReservationsPage'
import { WhoPage } from './pages/group/WhoPage'

/**
 * Routage en mode hash (`/#/g/CODE/e/ID`) : GitHub Pages ne sait pas servir
 * les routes côté serveur. Routes cibles : voir docs/SPEC.md, section UX / UI.
 */
export const router = createHashRouter([
  { path: '/', element: <HomePage /> },
  { path: '/nouveau', element: <CreateGroupPage /> },
  {
    path: '/g/:code',
    element: <GroupLayout />,
    children: [
      { index: true, element: <GroupHomePage /> },
      { path: 'qui', element: <WhoPage /> },
      { path: 'e/nouveau', element: <EventFormPage mode="create" /> },
      { path: 'e/:eventId', element: <EventPage /> },
      { path: 'e/:eventId/modifier', element: <EventFormPage mode="edit" /> },
      { path: 'membres', element: <MembersPage /> },
      { path: 'reservations', element: <ReservationsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  { path: '/diagnostic', element: <DiagnosticPage /> },
  { path: '*', element: <NotFoundPage /> },
])
