import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import {
  createDoctorProfile,
  getDoctorProfile,
  updateDoctorProfile,
} from '@/app/actions/doctors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  CONSULTATION_BLOCK_MINUTES,
  parseTimeToMinutes,
} from '@/lib/consultation-scheduling'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

function optionalNumber(value: FormDataEntryValue | null) {
  if (typeof value !== 'string' || value.trim() === '') {
    return undefined
  }

  return Number(value)
}

function optionalString(value: FormDataEntryValue | null) {
  if (typeof value !== 'string' || value.trim() === '') {
    return undefined
  }

  return value
}

export default async function DoctorProfileEditorPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    redirect('/sign-in')
  }

  const profile = await getDoctorProfile(session.user.id)

  async function saveDoctorProfile(formData: FormData) {
    'use server'

    const data = {
      specialty: String(formData.get('specialty') || ''),
      bio: optionalString(formData.get('bio')),
      licenseNumber: optionalString(formData.get('licenseNumber')),
      experienceYears: optionalNumber(formData.get('experienceYears')),
      hourlyRate: optionalString(formData.get('hourlyRate')),
      isAvailable: formData.get('isAvailable') === 'on',
      availableFrom: optionalString(formData.get('availableFrom')),
      availableUntil: optionalString(formData.get('availableUntil')),
    }

    if (!data.specialty) {
      throw new Error('Specialty is required')
    }

    const availableFromMinutes = parseTimeToMinutes(data.availableFrom)
    const availableUntilMinutes = parseTimeToMinutes(data.availableUntil)

    if (
      (data.availableFrom && availableFromMinutes === null) ||
      (data.availableUntil && availableUntilMinutes === null)
    ) {
      throw new Error('Availability times are invalid')
    }

    if (
      (availableFromMinutes === null && availableUntilMinutes !== null) ||
      (availableFromMinutes !== null && availableUntilMinutes === null)
    ) {
      throw new Error('Set both availability start and end times')
    }

    if (
      availableFromMinutes !== null &&
      availableUntilMinutes !== null &&
      availableUntilMinutes - availableFromMinutes < CONSULTATION_BLOCK_MINUTES
    ) {
      throw new Error('Availability must include at least one 30-minute block')
    }

    if (
      availableFromMinutes !== null &&
      availableFromMinutes % CONSULTATION_BLOCK_MINUTES !== 0
    ) {
      throw new Error('Availability start must be on a 30-minute block')
    }

    if (
      availableUntilMinutes !== null &&
      availableUntilMinutes % CONSULTATION_BLOCK_MINUTES !== 0
    ) {
      throw new Error('Availability end must be on a 30-minute block')
    }

    const userId = await auth.api
      .getSession({ headers: await headers() })
      .then((currentSession) => currentSession?.user.id)

    if (!userId) {
      redirect('/sign-in')
    }

    const existingProfile = await getDoctorProfile(userId)
    if (existingProfile) {
      await updateDoctorProfile(data)
    } else {
      await createDoctorProfile(data)
    }

    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Doctor Profile</h1>
        </div>
      </nav>

      <main className="container mx-auto max-w-2xl px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>
              {profile ? 'Edit Doctor Profile' : 'Create Doctor Profile'}
            </CardTitle>
            <CardDescription>
              This information appears on your public doctor profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={saveDoctorProfile} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="specialty">Specialty</Label>
                <Input
                  id="specialty"
                  name="specialty"
                  defaultValue={profile?.specialty || ''}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  defaultValue={profile?.bio || ''}
                  rows={5}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">License Number</Label>
                  <Input
                    id="licenseNumber"
                    name="licenseNumber"
                    defaultValue={profile?.licenseNumber || ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experienceYears">Experience Years</Label>
                  <Input
                    id="experienceYears"
                    name="experienceYears"
                    type="number"
                    min="0"
                    defaultValue={profile?.experienceYears || ''}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Hourly Rate</Label>
                  <Input
                    id="hourlyRate"
                    name="hourlyRate"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={profile?.hourlyRate || ''}
                  />
                </div>

                <label className="flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium">
                  <input
                    name="isAvailable"
                    type="checkbox"
                    defaultChecked={profile?.isAvailable ?? true}
                    className="h-4 w-4"
                  />
                  Available for booking
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="availableFrom">Available From</Label>
                  <Input
                    id="availableFrom"
                    name="availableFrom"
                    type="time"
                    step="1800"
                    defaultValue={profile?.availableFrom?.slice(0, 5) || ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="availableUntil">Available Until</Label>
                  <Input
                    id="availableUntil"
                    name="availableUntil"
                    type="time"
                    step="1800"
                    defaultValue={profile?.availableUntil?.slice(0, 5) || ''}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                Save Profile
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
