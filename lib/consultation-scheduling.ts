export const CONSULTATION_BLOCK_MINUTES = 30

const TIME_PATTERN = /^(\d{2}):(\d{2})(?::\d{2})?$/

export function parseTimeToMinutes(time: string | null | undefined) {
  if (!time) {
    return null
  }

  const match = time.match(TIME_PATTERN)
  if (!match) {
    return null
  }

  return Number(match[1]) * 60 + Number(match[2])
}

export function formatTimeForInput(time: string | null | undefined) {
  if (!time) {
    return ''
  }

  return time.slice(0, 5)
}

export function formatMinutesForInput(totalMinutes: number | null) {
  if (totalMinutes === null || totalMinutes < 0 || totalMinutes > 23 * 60 + 59) {
    return ''
  }

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function isThirtyMinuteBlock(date: Date) {
  return (
    date.getMinutes() % CONSULTATION_BLOCK_MINUTES === 0 &&
    date.getSeconds() === 0 &&
    date.getMilliseconds() === 0
  )
}

export function isWithinDoctorAvailability(
  scheduledAt: Date,
  availableFrom: string | null | undefined,
  availableUntil: string | null | undefined,
) {
  const fromMinutes = parseTimeToMinutes(availableFrom)
  const untilMinutes = parseTimeToMinutes(availableUntil)

  if (fromMinutes === null || untilMinutes === null) {
    return true
  }

  const startMinutes = scheduledAt.getHours() * 60 + scheduledAt.getMinutes()
  const endMinutes = startMinutes + CONSULTATION_BLOCK_MINUTES

  return startMinutes >= fromMinutes && endMinutes <= untilMinutes
}
