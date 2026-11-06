import { describe, expect, it } from 'vitest'
import { presetFor, withBeneficiariesAsParticipants } from './events'
import type { Member } from './groups'

const members: Member[] = ['lea', 'tom', 'mamie'].map((id) => ({
  id,
  name: id,
  color: '#b8322a',
  archived: false,
}))

describe('préréglages d’évènement (C2)', () => {
  it('Noël coche tout le monde dans les deux listes', () => {
    expect(presetFor('noel', members, 'lea')).toEqual({
      beneficiaryIds: ['lea', 'tom', 'mamie'],
      participantIds: ['lea', 'tom', 'mamie'],
    })
  })

  it('Anniversaire : tout le monde participe, bénéficiaire à choisir', () => {
    expect(presetFor('anniversaire', members, 'lea')).toEqual({
      beneficiaryIds: [],
      participantIds: ['lea', 'tom', 'mamie'],
    })
  })

  it('Autre : seulement moi comme participant', () => {
    expect(presetFor('autre', members, 'tom')).toEqual({
      beneficiaryIds: [],
      participantIds: ['tom'],
    })
  })

  it('un bénéficiaire est automatiquement participant', () => {
    const draft = withBeneficiariesAsParticipants({
      title: 'Naissance',
      type: 'autre',
      date: null,
      beneficiaryIds: ['mamie'],
      participantIds: ['lea'],
    })
    expect(draft.participantIds.sort()).toEqual(['lea', 'mamie'])
  })
})
