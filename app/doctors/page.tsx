import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getAllDoctors } from '@/app/actions/doctors'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { DoctorDiscovery, type DoctorDiscoveryItem } from './doctor-discovery'

type DoctorsPageProps = {
  searchParams?: Promise<{
    q?: string | string[]
  }>
}

export default async function DoctorsPage({ searchParams }: DoctorsPageProps) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    redirect('/sign-in')
  }

  const doctors = await getAllDoctors()
  const params = await searchParams
  const initialQuery = Array.isArray(params?.q) ? params?.q[0] : params?.q
  const doctorItems: DoctorDiscoveryItem[] = doctors.map((doctor) => ({
    id: doctor.id,
    name: doctor.name,
    givenName: doctor.givenName,
    lastName: doctor.lastName,
    specialty: doctor.specialty,
    bio: doctor.bio,
    experienceYears: doctor.experienceYears,
    hourlyRate: doctor.hourlyRate ? String(doctor.hourlyRate) : null,
    isAvailable: doctor.isAvailable,
  }))

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-6 py-12 sm:px-8 lg:px-10">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Browse Doctors</h1>
          <p className="text-muted-foreground">
            Find verified healthcare professionals by symptom, medical need, or specialization.
          </p>
        </div>

        {doctorItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No doctors available at the moment.</p>
            <Link href="/dashboard">
              <Button>Return to Dashboard</Button>
            </Link>
          </div>
        ) : (
          <DoctorDiscovery doctors={doctorItems} initialQuery={initialQuery} />
        )}
      </main>
    </div>
  )
}
