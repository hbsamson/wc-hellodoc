import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getPatientConsultations, getDoctorConsultations } from '@/app/actions/consultations'
import { getUserRole } from '@/app/actions/helpers'
import { DashboardNav } from './dashboard-nav'
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
  const userType = isDoctor ? 'doctor' : 'patient'
  const userName = session.user.name || session.user.email || 'there'

  return (
    <div className="min-h-screen">
      <DashboardNav
        userName={session.user.name || ''}
        userEmail={session.user.email || ''}
        userType={userType}
      />
      <div className="lg:pl-72">
        {isDoctor ? (
          <DoctorDashboard userName={userName} consultations={consultations} />
        ) : (
          <PatientDashboard userName={userName} consultations={consultations} />
        )}
      </div>
    </div>
  )
}
