import { createContext, useContext } from 'react'
import type { Group, Member } from './groups'

export interface GroupContextValue {
  /** Code sans tiret (= identifiant Firestore). */
  code: string
  group: Group
  /** Tous les membres, archivés compris, triés par prénom. */
  members: Member[]
  /** Membre choisi sur cet appareil (A2), s'il existe et n'est pas archivé. */
  me: Member | undefined
  chooseIdentity: (memberId: string) => void
  /** Chemin de base des routes du groupe, ex. `/g/K7M2-QX4P`. */
  basePath: string
}

export const GroupContext = createContext<GroupContextValue | null>(null)

export function useGroup(): GroupContextValue {
  const value = useContext(GroupContext)
  if (!value) throw new Error('useGroup doit être utilisé sous <GroupLayout>')
  return value
}

/** Comme `useGroup`, mais garantit qu'une identité est choisie (sinon le layout redirige). */
export function useMe(): GroupContextValue & { me: Member } {
  const value = useGroup()
  if (!value.me) throw new Error('Aucune identité choisie')
  return value as GroupContextValue & { me: Member }
}
