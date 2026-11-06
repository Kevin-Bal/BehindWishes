import { describe, expect, it } from 'vitest'
import { aggregateStatus, changedSinceClaim, claimId, type Claim } from './claims'
import type { Wish } from './wishes'

const claim = (overrides: Partial<Claim> = {}): Claim => ({
  id: 'w1_tom',
  wishId: 'w1',
  beneficiaryId: 'lea',
  claimedBy: 'tom',
  status: 'reserved',
  claimedAt: new Date(2026, 10, 10),
  ...overrides,
})

const wish = (overrides: Partial<Wish> = {}): Wish => ({
  id: 'w1',
  beneficiaryId: 'lea',
  title: 'Un livre',
  createdAt: new Date(2026, 10, 1),
  updatedAt: new Date(2026, 10, 1),
  deleted: false,
  ...overrides,
})

describe('réservations', () => {
  it('une réservation par personne et par souhait', () => {
    expect(claimId('w1', 'tom')).toBe('w1_tom')
  })

  it('statut agrégé : Libre, Réservé, Acheté (E1)', () => {
    expect(aggregateStatus([])).toBe('free')
    expect(aggregateStatus([claim()])).toBe('reserved')
    expect(aggregateStatus([claim(), claim({ id: 'w1_mamie', status: 'purchased' })])).toBe(
      'purchased',
    )
  })

  it('« Modifié » seulement si titre ou lien changé après la réservation', () => {
    expect(changedSinceClaim(wish(), claim())).toBe(false)
    expect(changedSinceClaim(wish({ contentUpdatedAt: new Date(2026, 10, 5) }), claim())).toBe(
      false,
    )
    expect(changedSinceClaim(wish({ contentUpdatedAt: new Date(2026, 10, 12) }), claim())).toBe(
      true,
    )
  })
})
