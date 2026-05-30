'use client'

import { useEffect, useMemo, useState } from 'react'
import { Clock } from 'lucide-react'

type ConsultationStartTimerProps = {
  scheduledAt: string | Date
  status: string
  compact?: boolean
}

export function ConsultationStartTimer({
  scheduledAt,
  status,
  compact = false,
}: ConsultationStartTimerProps) {
  const scheduledTime = useMemo(
    () => new Date(scheduledAt).getTime(),
    [scheduledAt],
  )
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000)

    return () => window.clearInterval(interval)
  }, [])

  if (status === 'in-progress') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-300">
        <span className="h-2 w-2 rounded-full bg-green-600" />
        Consultation is live
      </span>
    )
  }

  if (status !== 'scheduled') {
    return null
  }

  const remainingMs = scheduledTime - now
  const startsAt = new Date(scheduledAt).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })

  if (remainingMs <= 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-300">
        <Clock className="h-3.5 w-3.5" />
        Scheduled time has arrived
      </span>
    )
  }

  const totalMinutes = Math.ceil(remainingMs / 60000)
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60
  const countdown =
    days > 0
      ? `${days}d ${hours}h`
      : hours > 0
        ? `${hours}h ${minutes}m`
        : `${minutes}m`

  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
      <Clock className="h-3.5 w-3.5" />
      {compact
        ? `Starts ${startsAt} (${countdown})`
        : `Your consultation starts at ${startsAt} (${countdown})`}
    </span>
  )
}
