'use client'

import { useMemo, useState } from 'react'
import { Textarea } from '@/components/ui/textarea'

type ConsultationPersonalNotesProps = {
  consultationId: string
}

export function ConsultationPersonalNotes({
  consultationId,
}: ConsultationPersonalNotesProps) {
  const storageKey = useMemo(
    () => `hellodoc:consultation:${consultationId}:personal-notes`,
    [consultationId],
  )
  const [notes, setNotes] = useState(() => {
    if (typeof window === 'undefined') {
      return ''
    }

    return window.localStorage.getItem(storageKey) || ''
  })

  return (
    <Textarea
      value={notes}
      rows={6}
      placeholder="Write symptoms, questions, or reminders for this consultation..."
      onChange={(event) => {
        const nextNotes = event.target.value
        setNotes(nextNotes)
        window.localStorage.setItem(storageKey, nextNotes)
      }}
    />
  )
}
