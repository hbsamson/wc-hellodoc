'use client'

import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface AvailabilityToggleProps {
  name: string
  defaultChecked?: boolean
}

/**
 * Renders a Radix UI Switch that syncs its value to a hidden input
 * so it works correctly inside a server-action `<form>`.
 */
export function AvailabilityToggle({
  name,
  defaultChecked = true,
}: AvailabilityToggleProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3">
      <input
        id={`${name}-hidden`}
        type="hidden"
        name={name}
        value={defaultChecked ? 'on' : ''}
      />
      <Switch
        id={name}
        defaultChecked={defaultChecked}
        onCheckedChange={(checked) => {
          const input = document.getElementById(
            `${name}-hidden`,
          ) as HTMLInputElement
          if (input) input.value = checked ? 'on' : ''
        }}
      />
      <Label htmlFor={name} className="text-sm font-medium cursor-pointer">
        Available for booking
      </Label>
    </div>
  )
}