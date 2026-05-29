import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getConsultation, startConsultation } from '@/app/actions/consultations'
import { ConsultationRoom } from '@/components/consultation-room'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface ConsultationDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ConsultationDetailPage({ params }: ConsultationDetailPageProps) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    redirect('/sign-in')
  }

  const { id } = await params
  const consultation = await getConsultation(id)

  const isDoctor = consultation.doctorId === session.user.id
  const isPatient = consultation.patientId === session.user.id

  if (!isDoctor && !isPatient) {
    redirect('/consultations')
  }

  // If scheduled and doctor, allow starting the consultation
  if (consultation.status === 'scheduled' && isDoctor) {
    // Note: In a real app, you'd handle the start action properly
    // For now, this is just for display
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Simple header with back button */}
      <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/consultations">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="font-semibold">Consultation</h1>
              <p className="text-sm text-muted-foreground">
                {new Date(consultation.scheduledAt).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium capitalized">
              Status: <span className="text-primary">{consultation.status}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {consultation.status === 'scheduled' ? (
          <div>
            {isDoctor ? (
              <div className="max-w-2xl mx-auto">
                <div className="bg-muted rounded-lg p-8 text-center mb-6">
                  <p className="text-lg mb-4">Ready to start the consultation?</p>
                  <form
                    action={async () => {
                      'use server'
                      await startConsultation(id)
                      redirect(`/consultations/${id}`)
                    }}
                  >
                    <Button size="lg" type="submit">
                      Start Consultation
                    </Button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto bg-muted rounded-lg p-8 text-center">
                <p className="text-muted-foreground">
                  Waiting for the doctor to start the consultation...
                </p>
              </div>
            )}
          </div>
        ) : consultation.status === 'in-progress' ? (
          <div className="h-[600px] rounded-lg overflow-hidden">
            <ConsultationRoom
              consultationId={id}
              isDoctor={isDoctor}
              onEnd={() => {
                redirect('/consultations')
              }}
            />
          </div>
        ) : consultation.status === 'completed' ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <p className="text-green-700 font-semibold mb-2">Consultation Completed</p>
              {consultation.endedAt && (
                <p className="text-sm text-green-600">
                  Ended on {new Date(consultation.endedAt).toLocaleString()}
                </p>
              )}
            </div>

            {consultation.notes && (
              <div className="bg-background border rounded-lg p-6">
                <h3 className="font-semibold mb-2">Doctor&apos;s Notes</h3>
                <p className="text-muted-foreground">{consultation.notes}</p>
              </div>
            )}
          </div>
        ) : consultation.status === 'cancelled' ? (
          <div className="max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 font-semibold">Consultation Cancelled</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
