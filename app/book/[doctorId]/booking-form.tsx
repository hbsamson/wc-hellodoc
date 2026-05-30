'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  CONSULTATION_BLOCK_MINUTES,
  formatMinutesForInput,
  formatTimeForInput,
  parseTimeToMinutes,
} from '@/lib/consultation-scheduling'

interface BookingFormProps {
  doctor: {
    id: string
    name: string | null
    specialty: string | null
    isAvailable: boolean
    availableFrom: string | null
    availableUntil: string | null
  }
}

export function BookingForm({ doctor }: BookingFormProps) {
  const router = useRouter()
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const availableFrom = formatTimeForInput(doctor.availableFrom)
  const availableUntil = formatTimeForInput(doctor.availableUntil)
  const availableFromMinutes = parseTimeToMinutes(doctor.availableFrom)
  const availableUntilMinutes = parseTimeToMinutes(doctor.availableUntil)
  const hasAvailabilityWindow = Boolean(availableFrom && availableUntil)
  const today = useMemo(() => new Date().toISOString().split('T')[0], [])
  const canBook = doctor.isAvailable
  const slots = useMemo(() => {
    const startMinutes = availableFromMinutes ?? 9 * 60
    const endMinutes = availableUntilMinutes ?? 17 * 60
    const generatedSlots: Array<{
      value: string
      label: string
      disabled: boolean
    }> = []
    const now = new Date()

    for (
      let slotStart = startMinutes;
      slotStart + CONSULTATION_BLOCK_MINUTES <= endMinutes;
      slotStart += CONSULTATION_BLOCK_MINUTES
    ) {
      const slotEnd = slotStart + CONSULTATION_BLOCK_MINUTES
      const value = formatMinutesForInput(slotStart)
      const endValue = formatMinutesForInput(slotEnd)

      if (!value || !endValue) {
        continue
      }

      const slotDate = date ? new Date(`${date}T${value}`) : null
      generatedSlots.push({
        value,
        label: `${value}-${endValue}`,
        disabled: Boolean(slotDate && slotDate <= now),
      })
    }

    return generatedSlots
  }, [availableFromMinutes, availableUntilMinutes, date])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!canBook) {
        throw new Error('This doctor is not available for booking')
      }

      if (!date || !time) {
        throw new Error('Please select date and time')
      }

      const scheduledAt = new Date(`${date}T${time}`)
      if (scheduledAt <= new Date()) {
        throw new Error('Cannot book consultation in the past')
      }

      if (scheduledAt.getMinutes() % 30 !== 0) {
        throw new Error('Please choose a 30-minute time block')
      }

      const response = await fetch('/api/consultations/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: doctor.id,
          scheduledAt: scheduledAt.toISOString(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to book consultation')
      }

      const consultation = await response.json()
      router.push(`/consultations/${consultation.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Link href="/doctors">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Book Consultation</h1>
        </div>
      </nav>

      <main className="container mx-auto max-w-md px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule Consultation
            </CardTitle>
            <CardDescription>
              {doctor.name || 'Doctor'}
              {doctor.specialty ? `, ${doctor.specialty}` : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {!canBook && (
                <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                  This doctor is currently not accepting bookings.
                </div>
              )}

              {hasAvailabilityWindow && (
                <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                  Available from {availableFrom} to {availableUntil}. Starts are
                  limited to 30-minute blocks.
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value)
                    setTime('')
                  }}
                  required
                  disabled={loading || !canBook}
                  min={today}
                />
              </div>

              <div className="space-y-2">
                <Label>Time</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {slots.map((slot) => (
                    <Button
                      key={slot.value}
                      type="button"
                      variant={time === slot.value ? 'default' : 'outline'}
                      className="h-10 px-2 text-xs"
                      disabled={loading || !canBook || !date || slot.disabled}
                      onClick={() => setTime(slot.value)}
                    >
                      {slot.label}
                    </Button>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading || !canBook}>
                {loading ? 'Booking...' : 'Book Consultation'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
