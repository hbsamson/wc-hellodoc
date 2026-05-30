import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import {
  cancelConsultation,
  endConsultation,
  getConsultationWorkspace,
  rescheduleConsultation,
  saveConsultationNotes,
  savePrescription,
  startConsultation,
} from '@/app/actions/consultations'
import { ConsultationRoom } from '@/components/consultation-room'
import { Badge } from '@/components/ui/badge'
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
import Link from 'next/link'
import {
  ArrowLeft,
  CalendarClock,
  ClipboardList,
  FileText,
  Pill,
  UserRound,
} from 'lucide-react'

interface ConsultationDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ConsultationDetailPage({
  params,
}: ConsultationDetailPageProps) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    redirect('/sign-in')
  }

  const { id } = await params
  const workspace = await getConsultationWorkspace(id)
  const {
    consultation,
    patient,
    doctor,
    consultationHistory,
    prescription,
    isDoctor,
    isPatient,
  } = workspace

  if (!isDoctor && !isPatient) {
    redirect('/consultations')
  }

  const roomName = `hellodoc-${consultation.id}`
  const patientName = patient?.name || 'Patient'
  const doctorName = doctor?.name || 'Doctor'

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/consultations">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
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
          <Badge variant={consultation.status === 'in-progress' ? 'default' : 'secondary'}>
            {consultation.status}
          </Badge>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {consultation.status === 'scheduled' ? (
          <WaitingRoom
            consultationId={id}
            isDoctor={isDoctor}
            patientName={patientName}
            doctorName={doctorName}
            scheduledAt={consultation.scheduledAt}
            doctorAvailability={{
              availableFrom: doctor?.availableFrom,
              availableUntil: doctor?.availableUntil,
            }}
          />
        ) : consultation.status === 'in-progress' ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <ConsultationRoom consultationId={id} roomName={roomName} />
            {isDoctor ? (
              <DoctorWorkspace
                consultationId={id}
                patient={patient}
                history={consultationHistory}
                notes={consultation.notes || ''}
                prescription={prescription}
              />
            ) : (
              <PatientSessionPanel doctorName={doctorName} prescription={prescription} />
            )}
          </div>
        ) : consultation.status === 'completed' ? (
          <CompletedSummary
            endedAt={consultation.endedAt}
            notes={consultation.notes}
            prescription={prescription}
          />
        ) : consultation.status === 'cancelled' ? (
          <Card className="mx-auto max-w-2xl border-red-200 bg-red-50">
            <CardContent className="py-10 text-center">
              <p className="font-semibold text-red-700">Consultation Cancelled</p>
            </CardContent>
          </Card>
        ) : null}
      </main>
    </div>
  )
}

function WaitingRoom({
  consultationId,
  isDoctor,
  patientName,
  doctorName,
  scheduledAt,
  doctorAvailability,
}: {
  consultationId: string
  isDoctor: boolean
  patientName: string
  doctorName: string
  scheduledAt: Date
  doctorAvailability: {
    availableFrom?: string | null
    availableUntil?: string | null
  }
}) {
  const defaultDate = formatDateForInput(scheduledAt)
  const defaultTime = formatTimeForInput(scheduledAt)
  const minDate = formatDateForInput(new Date())
  const availabilityText =
    doctorAvailability.availableFrom && doctorAvailability.availableUntil
      ? `${doctorAvailability.availableFrom.slice(0, 5)}-${doctorAvailability.availableUntil.slice(0, 5)}`
      : null

  return (
    <div className="mx-auto grid max-w-2xl gap-4">
      <Card>
        <CardHeader className="text-center">
          <CardTitle>{isDoctor ? 'Patient is in the waiting room' : 'Waiting room'}</CardTitle>
          <CardDescription>
            {isDoctor
              ? `${patientName} can join once you start the session.`
              : `${doctorName} will let you in when the consultation is ready.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-8">
          {isDoctor ? (
            <form
              action={async () => {
                'use server'
                await startConsultation(consultationId)
                redirect(`/consultations/${consultationId}`)
              }}
            >
              <Button size="lg" type="submit">
                Let Patient In
              </Button>
            </form>
          ) : (
            <div className="rounded-md bg-muted px-4 py-3 text-sm text-muted-foreground">
              Keep this page open. Refresh if your doctor has started the session.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarClock className="h-5 w-5 text-primary" />
            Appointment Schedule
          </CardTitle>
          <CardDescription>
            {availabilityText
              ? `Doctor availability: ${availabilityText}`
              : 'Choose a future 30-minute start time.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3"
            action={async (formData) => {
              'use server'
              const date = String(formData.get('date') || '')
              const time = String(formData.get('time') || '')
              await rescheduleConsultation(
                consultationId,
                new Date(`${date}T${time}`).toISOString(),
              )
              redirect(`/consultations/${consultationId}`)
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="appointment-date">Date</Label>
                <Input
                  id="appointment-date"
                  name="date"
                  type="date"
                  min={minDate}
                  defaultValue={defaultDate}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="appointment-time">Time</Label>
                <Input
                  id="appointment-time"
                  name="time"
                  type="time"
                  step={30 * 60}
                  defaultValue={defaultTime}
                  required
                />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="submit" variant="outline">
                Reschedule
              </Button>
              <Button
                type="submit"
                variant="destructive"
                formNoValidate
                formAction={async () => {
                  'use server'
                  await cancelConsultation(consultationId)
                  redirect('/consultations')
                }}
              >
                Cancel Appointment
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function DoctorWorkspace({
  consultationId,
  patient,
  history,
  notes,
  prescription,
}: {
  consultationId: string
  patient: {
    name: string | null
    email: string
    birthday: string | null
    weightKg: string | null
    heightCm: string | null
    phoneNumber: string | null
    address: string | null
    emergencyContactName: string | null
    emergencyContactPhone: string | null
    medicalHistory: string | null
  } | null
  history: {
    id: string
    status: string
    scheduledAt: Date
    endedAt: Date | null
    notes: string | null
  }[]
  notes: string
  prescription: {
    medications: string
    instructions: string | null
  } | null
}) {
  return (
    <aside className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserRound className="h-5 w-5 text-primary" />
            Patient profile
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <Info label="Name" value={patient?.name} />
          <Info label="Email" value={patient?.email} />
          <Info label="Birthday" value={patient?.birthday} />
          <Info label="Weight" value={patient?.weightKg ? `${patient.weightKg} kg` : null} />
          <Info label="Height" value={patient?.heightCm ? `${patient.heightCm} cm` : null} />
          <Info label="Phone" value={patient?.phoneNumber} />
          <Info label="Address" value={patient?.address} />
          <Info
            label="Emergency"
            value={
              patient?.emergencyContactName || patient?.emergencyContactPhone
                ? `${patient.emergencyContactName || ''} ${patient.emergencyContactPhone || ''}`.trim()
                : null
            }
          />
          <Info label="Medical history" value={patient?.medicalHistory} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="h-5 w-5 text-primary" />
            Session notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3"
            action={async (formData) => {
              'use server'
              await saveConsultationNotes(
                consultationId,
                String(formData.get('notes') || ''),
              )
            }}
          >
            <Textarea
              name="notes"
              defaultValue={notes}
              rows={6}
              placeholder="Assessment, findings, care plan..."
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="submit" variant="outline">
                Save Notes
              </Button>
              <Button
                type="submit"
                formAction={async (formData) => {
                  'use server'
                  await endConsultation(
                    consultationId,
                    String(formData.get('notes') || ''),
                  )
                  redirect(`/consultations/${consultationId}`)
                }}
              >
                End Session
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Pill className="h-5 w-5 text-primary" />
            Prescription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3"
            action={async (formData) => {
              'use server'
              await savePrescription(consultationId, {
                medications: String(formData.get('medications') || ''),
                instructions: String(formData.get('instructions') || ''),
              })
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="medications">Medication</Label>
              <Textarea
                id="medications"
                name="medications"
                defaultValue={prescription?.medications || ''}
                rows={4}
                placeholder="Medicine, dosage, frequency, duration"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="instructions">Instructions</Label>
              <Input
                id="instructions"
                name="instructions"
                defaultValue={prescription?.instructions || ''}
                placeholder="After meals, follow-up reminders..."
              />
            </div>
            <Button type="submit">Generate Prescription</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            Consultation history
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {history.map((item) => (
            <div key={item.id} className="rounded-md border p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">
                  {new Date(item.scheduledAt).toLocaleDateString()}
                </span>
                <Badge variant="secondary">{item.status}</Badge>
              </div>
              {item.notes && (
                <p className="mt-2 line-clamp-3 text-muted-foreground">{item.notes}</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </aside>
  )
}

function PatientSessionPanel({
  doctorName,
  prescription,
}: {
  doctorName: string
  prescription: {
    medications: string
    instructions: string | null
  } | null
}) {
  return (
    <aside className="grid content-start gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Session details</CardTitle>
          <CardDescription>{doctorName} is connected to this consultation.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Your doctor may add notes and prescriptions during or after the visit.
        </CardContent>
      </Card>
      {prescription && (
        <Card>
          <CardHeader>
            <CardTitle>Prescription</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <p>{prescription.medications}</p>
            {prescription.instructions && (
              <p className="text-muted-foreground">{prescription.instructions}</p>
            )}
          </CardContent>
        </Card>
      )}
    </aside>
  )
}

function CompletedSummary({
  endedAt,
  notes,
  prescription,
}: {
  endedAt: Date | null
  notes: string | null
  prescription: {
    medications: string
    instructions: string | null
  } | null
}) {
  return (
    <div className="mx-auto grid max-w-2xl gap-4">
      <Card className="border-green-200 bg-green-50">
        <CardContent className="py-6">
          <p className="font-semibold text-green-700">Consultation Completed</p>
          {endedAt && (
            <p className="mt-1 text-sm text-green-700">
              Ended on {new Date(endedAt).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>
      {notes && (
        <Card>
          <CardHeader>
            <CardTitle>Doctor notes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{notes}</CardContent>
        </Card>
      )}
      {prescription && (
        <Card>
          <CardHeader>
            <CardTitle>Prescription</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <p>{prescription.medications}</p>
            {prescription.instructions && (
              <p className="text-muted-foreground">{prescription.instructions}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="whitespace-pre-wrap">{value || 'Not provided'}</p>
    </div>
  )
}

function formatDateForInput(date: Date) {
  return date.toISOString().slice(0, 10)
}

function formatTimeForInput(date: Date) {
  return date.toTimeString().slice(0, 5)
}
