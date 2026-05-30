'use client'

import { useId } from 'react'

const HOURS = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, '0'),
)

const MINUTES = ['00', '30']

interface TimePickerProps {
  /** The name used for the hidden combined HH:MM input. */
  name: string
  /** Default value (HH:MM). */
  defaultValue?: string
}

/**
 * Renders two native `<select>` elements (hour / minute) and a hidden
 * input that combines their values into `HH:MM` for the server action.
 */
export function TimePicker({ name, defaultValue = '' }: TimePickerProps) {
  const id = useId()
  const hourDefault = defaultValue ? defaultValue.slice(0, 2) : ''
  const minDefault = defaultValue ? defaultValue.slice(3, 5) : ''

  function updateCombined() {
    const hour = (document.getElementById(`${id}-hour`) as HTMLSelectElement)
      ?.value
    const min = (document.getElementById(`${id}-min`) as HTMLSelectElement)
      ?.value
    const combined = document.getElementById(`${id}-combined`) as HTMLInputElement
    if (combined) {
      combined.value = hour && min ? `${hour}:${min}` : ''
    }
  }

  return (
    <div className="flex gap-2">
      <input id={`${id}-combined`} name={name} type="hidden" value={defaultValue} />
      <select
        id={`${id}-hour`}
        defaultValue={hourDefault}
        onChange={updateCombined}
        className="border-gray-200 dark:border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-[5.5rem] rounded-md border px-2 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">Hour</option>
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <span className="flex items-center text-sm text-muted-foreground">:</span>
      <select
        id={`${id}-min`}
        defaultValue={minDefault}
        onChange={updateCombined}
        className="border-gray-200 dark:border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-[5rem] rounded-md border px-2 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">Min</option>
        {MINUTES.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>
  )
}