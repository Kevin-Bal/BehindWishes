import { useState } from 'react'
import { Link } from 'react-router'
import { InviteCard } from '../../components/InviteCard'
import { MemberSheet } from '../../components/MemberSheet'
import { GlassButton } from '../../components/glass'
import { PlusIcon } from '../../components/icons'
import { Avatar } from '../../components/ui/Avatar'
import { Card } from '../../components/ui/Card'
import { defaultAppearance } from '../../lib/appearance'
import { useMe } from '../../lib/groupContext'
import { addMember, updateMember, type Member } from '../../lib/groups'
import { GroupScreen } from './GroupScreen'

type SheetState = { mode: 'closed' } | { mode: 'add' } | { mode: 'edit'; member: Member }

/** Gestion des membres (B1, B2) : ajouter, renommer, couleur/emoji, archiver. */
export function MembersPage() {
  const { code, group, members, me, basePath } = useMe()
  const [sheet, setSheet] = useState<SheetState>({ mode: 'closed' })
  const [showArchived, setShowArchived] = useState(false)

  const active = members.filter((m) => !m.archived)
  const archived = members.filter((m) => m.archived)
  const editing = sheet.mode === 'edit' ? sheet.member : undefined
  // Le membre en cours d'édition reflète les mises à jour temps réel.
  const editingLive = editing && members.find((m) => m.id === editing.id)

  return (
    <GroupScreen
      title="Membres"
      fab={
        <GlassButton
          variant="tint"
          shape="fab"
          aria-label="Ajouter un membre"
          onClick={() => setSheet({ mode: 'add' })}
        >
          <PlusIcon className="size-7" />
        </GlassButton>
      }
    >
      <Card className="p-2">
        <ul className="flex flex-col">
          {active.map((m) => (
            <li key={m.id}>
              <MemberRow
                member={m}
                isMe={m.id === me.id}
                onEdit={() => setSheet({ mode: 'edit', member: m })}
              />
            </li>
          ))}
        </ul>
      </Card>

      {archived.length > 0 && (
        <Card className="p-2">
          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            aria-expanded={showArchived}
            className="flex min-h-11 w-full items-center justify-between rounded-2xl px-3 font-semibold"
          >
            Membres archivés ({archived.length})
            <span aria-hidden="true">{showArchived ? '−' : '+'}</span>
          </button>
          {showArchived && (
            <ul className="flex flex-col">
              {archived.map((m) => (
                <li key={m.id}>
                  <MemberRow
                    member={m}
                    isMe={false}
                    onEdit={() => setSheet({ mode: 'edit', member: m })}
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <InviteCard code={code} groupName={group.name} />

      <Link
        to={`${basePath}/reglages`}
        className="flex min-h-14 items-center justify-between rounded-[20px] border border-line bg-surface px-4 font-semibold"
      >
        Affichage et accessibilité
        <span aria-hidden="true" className="text-2xl text-ink-muted">
          ›
        </span>
      </Link>

      <MemberSheet
        open={sheet.mode !== 'closed'}
        onClose={() => setSheet({ mode: 'closed' })}
        member={editingLive}
        defaults={defaultAppearance(members.length)}
        takenNames={members.filter((m) => !m.archived).map((m) => m.name)}
        onSubmit={async (draft) => {
          if (editingLive) {
            await updateMember(code, editingLive.id, {
              name: draft.name,
              color: draft.color,
              emoji: draft.emoji,
            })
          } else {
            await addMember(code, draft)
          }
        }}
        onToggleArchive={
          editingLive && editingLive.id !== me.id
            ? () => updateMember(code, editingLive.id, { archived: !editingLive.archived })
            : undefined
        }
      />
    </GroupScreen>
  )
}

function MemberRow({
  member,
  isMe,
  onEdit,
}: {
  member: Member
  isMe: boolean
  onEdit: () => void
}) {
  return (
    <button
      type="button"
      onClick={onEdit}
      className="flex min-h-14 w-full items-center gap-3 rounded-2xl px-3 py-2 text-left active:bg-surface-muted"
    >
      <Avatar name={member.name} color={member.color} emoji={member.emoji} />
      <span className="flex-1 truncate text-lg font-semibold">{member.name}</span>
      {isMe && (
        <span className="rounded-full bg-surface-muted px-2.5 py-1 text-sm font-semibold">Toi</span>
      )}
      <span className="text-sm text-ink-muted underline underline-offset-2">Modifier</span>
    </button>
  )
}
