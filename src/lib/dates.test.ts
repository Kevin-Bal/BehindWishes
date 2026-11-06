import { describe, expect, it } from 'vitest'
import {
  compareEventDates,
  countdownLabel,
  daysUntil,
  fromDateInputValue,
  toDateInputValue,
} from './dates'

const now = new Date(2026, 10, 6, 18, 30) // 6 novembre 2026, 18 h 30

describe('dates', () => {
  it('compte les jours civils, quelle que soit l’heure (C1)', () => {
    expect(daysUntil(new Date(2026, 11, 25, 0, 5), now)).toBe(49)
    expect(countdownLabel(new Date(2026, 11, 25), now)).toBe('J-49')
    expect(countdownLabel(new Date(2026, 10, 7, 1), now)).toBe('Demain')
    expect(countdownLabel(new Date(2026, 10, 6, 8), now)).toBe('Aujourd’hui')
    expect(countdownLabel(new Date(2026, 10, 1), now)).toBe('Passé')
  })

  it('convertit les valeurs de <input type="date"> à midi local', () => {
    const date = fromDateInputValue('2026-12-25')
    expect(date?.getDate()).toBe(25)
    expect(date?.getHours()).toBe(12)
    expect(toDateInputValue(date ?? null)).toBe('2026-12-25')
    expect(fromDateInputValue('')).toBeNull()
    expect(toDateInputValue(null)).toBe('')
  })

  it('trie les évènements datés d’abord, du plus proche au plus lointain', () => {
    const dates = [null, new Date(2027, 0, 1), new Date(2026, 11, 25)]
    expect(dates.sort(compareEventDates)).toEqual([
      new Date(2026, 11, 25),
      new Date(2027, 0, 1),
      null,
    ])
  })
})
