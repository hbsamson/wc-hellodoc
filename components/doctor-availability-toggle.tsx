'use client'

import { useTransition } from 'react'
import { Switch } from '@/components/ui/switch'
import { toggleDoctorAvailability } from '@/app/actions/doctors'

interface Props {
  isAvailable: boolean
}

export function DoctorAvailabilityToggle({ isAvailable }: Props) {
  const [pending, startTransition] = useTransition()

  function handleToggle() {
    startTransition(async () => {
      await toggleDoctorAvailability()
    })
  }

  return (
    <div className="flex items-center gap-3">
      <Switch
        id="dashboard-availability"
        checked={isAvailable}
        onCheckedChange={handleToggle}
        disabled={pending}
      />
      <label
        htmlFor="dashboard-availability"
        className={`text-sm font-medium cursor-pointer ${
          isAvailable ? 'text-green-700 dark:text-green-300' : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        {isAvailable ? 'Available' : 'Unavailable'}
      </label>
    </div>
  )
}