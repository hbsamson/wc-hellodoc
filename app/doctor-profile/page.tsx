import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import {
  createDoctorProfile,
  getDoctorProfile,
  saveDoctorLicenseId,
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

const SPECIALIZATION_GROUPS = [
  {
    general: 'Primary Care',
    subspecializations: [
      'General Medicine',
      'Family Medicine',
      'Internal Medicine',
    ],
  },
  {
    general: 'Pediatrics',
    subspecializations: ['General Pediatrics', 'Neonatology'],
  },
  {
    general: 'Women\'s Health',
    subspecializations: ['Obstetrics and Gynecology', 'Reproductive Health'],
  },
  {
    general: 'Mental Health',
    subspecializations: ['Psychiatry', 'Clinical Psychology'],
  },
  {
    general: 'Medical Specialties',
    subspecializations: [
      'Cardiology',
      'Dermatology',
      'Endocrinology',
      'Gastroenterology',
      'Neurology',
      'Pulmonology',
    ],
  },
  {
    general: 'Surgical Specialties',
    subspecializations: ['General Surgery', 'Orthopedics', 'Ophthalmology'],
  },
]

const SPECIALIZATION_OPTIONS = SPECIALIZATION_GROUPS.flatMap((group) =>
  group.subspecializations.map(
    (subspecialization) => `${group.general} - ${subspecialization}`,
  ),
)

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

function splitName(name?: string | null) {
  if (!name) {
    return { givenName: '', lastName: '' }
  }

  const parts = name.trim().split(/\s+/)
  return {
    givenName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  }
}

async function saveLicenseId(file: FormDataEntryValue | null, required: boolean) {
  if (!(file instanceof File) || file.size === 0) {
    if (required) {
      throw new Error('License ID upload is required')
    }

    return undefined
  }

  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('License ID must be a PDF, JPG, PNG, or WebP file')
  }

  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    throw new Error('License ID must be 5MB or smaller')
  }

  return saveDoctorLicenseId(file)
}

export default async function DoctorProfileEditorPage({
  searchParams,
}: {
  searchParams: Promise<{ onboarding?: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    redirect('/sign-in')
  }

  const [{ onboarding }, profile] = await Promise.all([
    searchParams,
    getDoctorProfile(session.user.id),
  ])
  const isOnboarding = onboarding === '1'
  const profileName =
    profile?.givenName || profile?.lastName
      ? {
          givenName: profile.givenName || '',
          lastName: profile.lastName || '',
        }
      : splitName(profile?.name || session.user.name)

  async function saveDoctorProfile(formData: FormData) {
    'use server'
    const givenName = optionalString(formData.get('givenName'))
    const lastName = optionalString(formData.get('lastName'))
    const name = [givenName, lastName]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(' ')

    const data = {
      name,
      givenName,
      lastName,
      specialty: String(formData.get('specialty') || ''),
      bio: optionalString(formData.get('bio')),
      licenseNumber: optionalString(formData.get('licenseNumber')),
      experienceYears: optionalNumber(formData.get('experienceYears')),
      hourlyRate: optionalString(formData.get('hourlyRate')),
      isAvailable: isOnboarding ? true : formData.get('isAvailable') === 'on',
      availableFrom: optionalString(formData.get('availableFrom')),
      availableUntil: optionalString(formData.get('availableUntil')),
    }

    if (!data.name) {
      throw new Error('Full name is required')
    }

    if (!data.specialty) {
      throw new Error('Specialization is required')
    }

    if (isOnboarding && data.experienceYears === undefined) {
      throw new Error('Years of experience is required')
    }

    if (
      data.experienceYears !== undefined &&
      (!Number.isFinite(data.experienceYears) || data.experienceYears < 0)
    ) {
      throw new Error('Years of experience must be zero or greater')
    }

    if (isOnboarding && !data.hourlyRate) {
      throw new Error('Rate per session is required')
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

    await saveLicenseId(formData.get('licenseId'), isOnboarding)

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
      <main className="container mx-auto max-w-2xl px-4 py-12">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">
            {isOnboarding ? 'Doctor Onboarding' : 'Doctor Profile'}
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {isOnboarding
                ? 'Complete Your Doctor Profile'
                : profile
                  ? 'Edit Doctor Profile'
                  : 'Create Doctor Profile'}
            </CardTitle>
            <CardDescription>
              Add your profile details, specialization, availability, experience,
              and per-session rate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={saveDoctorProfile} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="givenName">Given Name</Label>
                  <Input
                    id="givenName"
                    name="givenName"
                    defaultValue={profileName.givenName}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    defaultValue={profileName.lastName}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialty">Specialization</Label>
                <select
                  id="specialty"
                  name="specialty"
                  defaultValue={profile?.specialty || ''}
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="" disabled>
                    Select general category - subspecialization
                  </option>
                  {profile?.specialty &&
                    !SPECIALIZATION_OPTIONS.includes(profile.specialty) && (
                      <option value={profile.specialty}>
                        {profile.specialty}
                      </option>
                    )}
                  {SPECIALIZATION_GROUPS.map((group) => (
                    <optgroup key={group.general} label={group.general}>
                      {group.subspecializations.map((subspecialization) => {
                        const value = `${group.general} - ${subspecialization}`

                        return (
                          <option key={value} value={value}>
                            {subspecialization}
                          </option>
                        )
                      })}
                    </optgroup>
                  ))}
                </select>
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
                  <Label htmlFor="experienceYears">Years of Experience</Label>
                  <Input
                    id="experienceYears"
                    name="experienceYears"
                    type="number"
                    min="0"
                    defaultValue={profile?.experienceYears || ''}
                    required={isOnboarding}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="licenseId">License ID Upload</Label>
                <Input
                  id="licenseId"
                  name="licenseId"
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  required={isOnboarding}
                />
                <p className="text-xs text-muted-foreground">
                  Upload a PDF, JPG, PNG, or WebP file up to 5MB.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Rate per Session</Label>
                  <Input
                    id="hourlyRate"
                    name="hourlyRate"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={profile?.hourlyRate || ''}
                    required={isOnboarding}
                  />
                </div>

                {!isOnboarding && (
                  <label className="flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium">
                    <input
                      name="isAvailable"
                      type="checkbox"
                      defaultChecked={profile?.isAvailable ?? true}
                      className="h-4 w-4"
                    />
                    Available for booking
                  </label>
                )}
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
                {isOnboarding ? 'Complete Onboarding' : 'Save Profile'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
