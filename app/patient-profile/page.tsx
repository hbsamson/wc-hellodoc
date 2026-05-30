import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft, Camera, HeartPulse, Phone, UserRound } from 'lucide-react'
import { auth } from '@/lib/auth'
import {
  getPatientProfile,
  isPatientProfileComplete,
  savePatientProfileImage,
  updatePatientProfile,
} from '@/app/actions/patients'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

function optionalString(value: FormDataEntryValue | null) {
  if (typeof value !== 'string' || value.trim() === '') {
    return undefined
  }

  return value.trim()
}

function requiredString(value: FormDataEntryValue | null) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error('Missing required field')
  }

  return value.trim()
}

async function saveProfileImage(file: FormDataEntryValue | null) {
  if (!(file instanceof File) || file.size === 0) {
    return undefined
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Profile picture must be an image')
  }

  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    throw new Error('Profile picture must be 5MB or smaller')
  }

  return savePatientProfileImage(file)
}

export default async function PatientProfilePage({
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
    getPatientProfile(session.user.id),
  ])
  const isOnboarding = onboarding === '1'
  const isComplete = profile ? await isPatientProfileComplete(profile) : false

  async function savePatientProfile(formData: FormData) {
    'use server'

    const uploadedImage = await saveProfileImage(formData.get('image'))
    const existingImage = optionalString(formData.get('existingImage'))

    await updatePatientProfile({
      name: requiredString(formData.get('name')),
      birthday: requiredString(formData.get('birthday')),
      weightKg: requiredString(formData.get('weightKg')),
      heightCm: requiredString(formData.get('heightCm')),
      image: uploadedImage || existingImage,
      phoneNumber: requiredString(formData.get('phoneNumber')),
      address: optionalString(formData.get('address')),
      emergencyContactName: optionalString(formData.get('emergencyContactName')),
      emergencyContactPhone: optionalString(formData.get('emergencyContactPhone')),
      medicalHistory: requiredString(formData.get('medicalHistory')),
    })

    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Patient Profile</h1>
        </div>
      </nav>

      <main className="container mx-auto max-w-3xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>
              {isOnboarding && !isComplete
                ? 'Complete Your Patient Profile'
                : 'Edit Patient Profile'}
            </CardTitle>
            <CardDescription>
              Keep your details current so doctors have the basics before a
              consultation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={savePatientProfile} className="space-y-8">
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <UserRound className="h-4 w-4 text-primary" />
                  Personal Details
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={profile?.name || session.user.name || ''}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birthday">Birthday</Label>
                    <Input
                      id="birthday"
                      name="birthday"
                      type="date"
                      defaultValue={profile?.birthday || ''}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="weightKg">Weight (kg)</Label>
                    <Input
                      id="weightKg"
                      name="weightKg"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={profile?.weightKg || ''}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="heightCm">Height (cm)</Label>
                    <Input
                      id="heightCm"
                      name="heightCm"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={profile?.heightCm || ''}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="image" className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Profile Picture
                  </Label>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted">
                      {profile?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={profile.image}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserRound className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <Input id="image" name="image" type="file" accept="image/*" />
                      <input
                        type="hidden"
                        name="existingImage"
                        value={profile?.image || ''}
                      />
                      <p className="text-xs text-muted-foreground">
                        Upload a JPG, PNG, or WebP image up to 5MB.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Phone className="h-4 w-4 text-primary" />
                  Contact Details
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      defaultValue={profile?.phoneNumber || ''}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactPhone">
                      Emergency Contact Phone
                    </Label>
                    <Input
                      id="emergencyContactPhone"
                      name="emergencyContactPhone"
                      type="tel"
                      defaultValue={profile?.emergencyContactPhone || ''}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyContactName">
                    Emergency Contact Name
                  </Label>
                  <Input
                    id="emergencyContactName"
                    name="emergencyContactName"
                    defaultValue={profile?.emergencyContactName || ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    name="address"
                    rows={3}
                    defaultValue={profile?.address || ''}
                  />
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <HeartPulse className="h-4 w-4 text-primary" />
                  Basic Medical History
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medicalHistory">
                    Conditions, allergies, medications, or relevant notes
                  </Label>
                  <Textarea
                    id="medicalHistory"
                    name="medicalHistory"
                    rows={6}
                    defaultValue={profile?.medicalHistory || ''}
                    required
                  />
                </div>
              </section>

              <Button type="submit" className="w-full">
                Save Patient Profile
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
