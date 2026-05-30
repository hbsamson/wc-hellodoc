import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getDoctorById } from '@/app/actions/doctors'
import { BookingForm } from './booking-form'

interface BookPageProps {
  params: Promise<{
    doctorId: string
  }>
}

export default async function BookConsultationPage({ params }: BookPageProps) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    redirect('/sign-in')
  }

  const { doctorId } = await params
  const doctor = await getDoctorById(doctorId)
  if (!doctor) {
    notFound()
  }

  return (
    <BookingForm
      doctor={{
        id: doctor.id,
        name: doctor.name,
        specialty: doctor.specialty,
        isAvailable: doctor.isAvailable,
        availableFrom: doctor.availableFrom,
        availableUntil: doctor.availableUntil,
      }}
    />
  )
}

