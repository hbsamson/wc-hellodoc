import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getPatientConsultations, getDoctorConsultations } from '@/app/actions/consultations'
import { getUserRole } from '@/app/actions/helpers'
import { DoctorDashboard } from './doctor-dashboard'
import { PatientDashboard } from './patient-dashboard'

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    redirect('/sign-in')
  }

  const userRole = await getUserRole()
  const isDoctor = userRole === 'doctor'

  const consultations = isDoctor
    ? await getDoctorConsultations()
    : await getPatientConsultations()
  const userName = session.user.name || session.user.email || 'there'

  // Fetch doctor availability
  let isAvailable = false
  if (isDoctor) {
    const currentUser = await db
      .select({ isAvailable: user.isAvailable })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1)
    isAvailable = currentUser[0]?.isAvailable ?? false
  }

  return (
    <div className="min-h-screen">
      {isDoctor ? (
        <DoctorDashboard
          userName={userName}
          consultations={consultations}
          isAvailable={isAvailable}
        />
      ) : (
        <PatientDashboard userName={userName} consultations={consultations} />
      )}
    </div>
  )
}
