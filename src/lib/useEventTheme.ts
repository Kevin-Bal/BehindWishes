import { useEffect } from 'react'
import type { EventType } from './events'
import { applyEventTheme } from './preferences'

/** Ambiance rouge/vert/crème pendant qu'un écran Noël est affiché, neutre sinon. */
export function useEventTheme(type: EventType | undefined): void {
  useEffect(() => {
    applyEventTheme(type === 'noel' ? 'noel' : 'neutral')
    return () => applyEventTheme('neutral')
  }, [type])
}
