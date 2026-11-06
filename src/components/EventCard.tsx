import { Link } from 'react-router'
import { countdownLabel, formatLongDate } from '../lib/dates'
import { eventTypeInfo, type GroupEvent } from '../lib/events'
import type { Member } from '../lib/groups'
import { cn } from '../lib/cn'
import { Avatar } from './ui/Avatar'

/** Carte d'évènement opaque (C1) : titre, type, date, compte à rebours, bénéficiaires. */
export function EventCard({
  event,
  members,
  to,
}: {
  event: GroupEvent
  members: Member[]
  to: string
}) {
  const info = eventTypeInfo(event.type)
  const beneficiaries = event.beneficiaryIds
    .map((id) => members.find((m) => m.id === id))
    .filter((m): m is Member => Boolean(m))
  const countdown = event.date ? countdownLabel(event.date) : null
  const past = countdown === 'Passé'

  return (
    <Link
      to={to}
      className={cn(
        'flex flex-col gap-3 rounded-[20px] border border-line bg-surface p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]',
        'transition-transform duration-200 active:scale-[0.98]',
        event.type === 'noel' && 'border-l-4 border-l-[#b8322a]',
        (past || event.archived) && 'opacity-75',
      )}
    >
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="text-3xl leading-none">
          {info.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold">{event.title}</h3>
          <p className="text-sm text-ink-muted">
            {info.label}
            {event.date && <> · {formatLongDate(event.date)}</>}
          </p>
        </div>
        {countdown && (
          <span
            className={cn(
              'shrink-0 rounded-full px-2.5 py-1 text-sm font-bold',
              past ? 'bg-surface-muted text-ink-muted' : 'bg-accent text-on-accent',
            )}
          >
            {countdown}
          </span>
        )}
      </div>
      {beneficiaries.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {beneficiaries.slice(0, 6).map((m) => (
              <Avatar key={m.id} name={m.name} color={m.color} emoji={m.emoji} size="sm" />
            ))}
          </div>
          <span className="truncate text-sm text-ink-muted">
            {beneficiaries.length === 1
              ? `Pour ${beneficiaries[0]?.name}`
              : `${beneficiaries.length} listes`}
          </span>
        </div>
      )}
    </Link>
  )
}
