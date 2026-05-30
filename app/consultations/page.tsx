import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import {
  getDoctorConsultations,
  getPatientConsultations,
} from '@/app/actions/consultations'
import { getUserRole } from '@/app/actions/helpers'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'
import {
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Stethoscope,
  VideoIcon,
} from 'lucide-react'

type Consultation = Awaited<ReturnType<typeof getPatientConsultations>>[number]

export default async function ConsultationsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    redirect('/sign-in')
  }

  const userRole = await getUserRole()
  const isDoctor = userRole === 'doctor'

  const consultations = isDoctor
    ? await getDoctorConsultations()
    : await getPatientConsultations()

  const now = new Date()
  const sortedConsultations = [...consultations].sort(
    (a, b) =>
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  )
  const categorizedConsultations = {
    scheduled: sortedConsultations.filter((c) => c.status === 'scheduled'),
    inProgress: sortedConsultations.filter((c) => c.status === 'in-progress'),
    completed: [...sortedConsultations]
      .filter((c) => c.status === 'completed')
      .sort(
        (a, b) =>
          new Date(b.endedAt || b.scheduledAt).getTime() -
          new Date(a.endedAt || a.scheduledAt).getTime(),
      ),
    cancelled: sortedConsultations.filter((c) => c.status === 'cancelled'),
  }
  const upcomingSchedule = sortedConsultations.filter(
    (consultation) =>
      ['scheduled', 'in-progress'].includes(consultation.status) &&
      (consultation.status === 'in-progress' ||
        new Date(consultation.scheduledAt) >= now),
  )
  const nextConsultation = upcomingSchedule[0]

  return (
    <main className="container mx-auto px-6 py-10 sm:px-8 lg:px-10">
      <section className="relative mb-10 overflow-hidden rounded-[2.5rem_1.25rem_2.75rem_1.5rem] border bg-[radial-gradient(circle_at_18%_20%,rgba(20,184,166,0.38),transparent_30%),radial-gradient(circle_at_82%_72%,rgba(45,212,191,0.32),transparent_34%),linear-gradient(135deg,rgba(240,253,250,0.96),rgba(204,251,241,0.78))] p-6 shadow-sm dark:bg-[radial-gradient(circle_at_18%_20%,rgba(20,184,166,0.22),transparent_30%),radial-gradient(circle_at_82%_72%,rgba(45,212,191,0.2),transparent_34%),linear-gradient(135deg,rgba(19,78,74,0.82),rgba(15,118,110,0.32))] sm:p-8">
        <div className="absolute -left-10 -top-8 h-32 w-32 rounded-full bg-teal-300/25 blur-2xl" />
        <div className="absolute -bottom-12 right-20 h-40 w-40 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-wide text-teal-800 dark:text-teal-100">
              Consultation Center
            </p>
            <h1 className="mt-2 text-4xl font-bold text-teal-950 dark:text-white">
              {isDoctor ? 'Manage patient sessions' : 'Your consultation visits'}
            </h1>
            <p className="mt-2 text-teal-950/70 dark:text-teal-50/80">
              {nextConsultation
                ? `Next schedule: ${formatDateTime(nextConsultation.scheduledAt)}.`
                : isDoctor
                  ? 'Review upcoming appointments, active calls, notes, and completed sessions.'
                  : 'Join scheduled appointments, check visit status, and review past care notes.'}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {nextConsultation ? (
                <Link href={`/consultations/${nextConsultation.id}`}>
                  <Button className="gap-2">
                    <VideoIcon className="h-4 w-4" />
                    {nextConsultation.status === 'in-progress'
                      ? 'Join Active Session'
                      : 'Open Next Schedule'}
                  </Button>
                </Link>
              ) : !isDoctor ? (
                <Link href="/doctors">
                  <Button className="gap-2">
                    <Stethoscope className="h-4 w-4" />
                    Book Consultation
                  </Button>
                </Link>
              ) : null}
            </div>
          </div>

          <div className="grid min-w-full gap-3 rounded-xl bg-white/70 p-4 shadow-sm dark:bg-background/70 sm:min-w-80">
            <p className="text-sm font-medium text-teal-950 dark:text-teal-50">
              Upcoming schedule
            </p>
            {upcomingSchedule.length > 0 ? (
              upcomingSchedule.slice(0, 3).map((consultation) => (
                <ScheduleMiniItem
                  key={consultation.id}
                  consultation={consultation}
                />
              ))
            ) : (
              <p className="rounded-md border border-dashed bg-background/70 p-4 text-sm text-muted-foreground">
                No upcoming schedules yet.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="mb-8 grid gap-4 md:grid-cols-4">
        <SummaryCard
          title="Active"
          value={categorizedConsultations.inProgress.length}
          label="Live sessions"
          icon={VideoIcon}
        />
        <SummaryCard
          title="Upcoming"
          value={upcomingSchedule.length}
          label="Scheduled visits"
          icon={CalendarCheck}
        />
        <SummaryCard
          title="Completed"
          value={categorizedConsultations.completed.length}
          label="Finished visits"
          icon={CheckCircle2}
        />
        <SummaryCard
          title="Total"
          value={consultations.length}
          label="Consultation records"
          icon={Stethoscope}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-8">
          <ConsultationSection
            title="Active Sessions"
            description="Calls that are ready to join right now."
            consultations={categorizedConsultations.inProgress}
            emptyText="No active consultation sessions."
            actionLabel="Join Session"
            statusTone="active"
          />
          <ConsultationSection
            title="Scheduled Consultations"
            description="Upcoming visits and waiting room access."
            consultations={categorizedConsultations.scheduled}
            emptyText="No scheduled consultations."
            actionLabel="View Schedule"
            statusTone="scheduled"
          />
          <ConsultationSection
            title="Completed Consultations"
            description="Past sessions with notes and prescriptions."
            consultations={categorizedConsultations.completed}
            emptyText="No completed consultations yet."
            actionLabel="View Details"
            statusTone="completed"
          />
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Upcoming Schedule
            </CardTitle>
            <CardDescription>
              {isDoctor
                ? 'Patients waiting for their scheduled appointments.'
                : 'Your next online appointment windows.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingSchedule.length > 0 ? (
              <div className="grid gap-3">
                {upcomingSchedule.map((consultation) => (
                  <ScheduleListItem
                    key={consultation.id}
                    consultation={consultation}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  No upcoming schedules.
                </p>
                {!isDoctor && (
                  <Link href="/doctors" className="mt-4 inline-flex">
                    <Button size="sm">Browse Doctors</Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

function SummaryCard({
  title,
  value,
  label,
  icon: Icon,
}: {
  title: string
  value: number
  label: string
  icon: typeof VideoIcon
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 pt-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
          <p className="mt-1 text-sm text-muted-foreground">{label}</p>
        </div>
        <span className="rounded-md bg-primary/10 p-2 text-primary">
          <Icon className="h-5 w-5" />
        </span>
      </CardContent>
    </Card>
  )
}

function ConsultationSection({
  title,
  description,
  consultations,
  emptyText,
  actionLabel,
  statusTone,
}: {
  title: string
  description: string
  consultations: Consultation[]
  emptyText: string
  actionLabel: string
  statusTone: 'active' | 'scheduled' | 'completed'
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {consultations.length > 0 ? (
          <div className="grid gap-3">
            {consultations.map((consultation) => (
              <ConsultationRow
                key={consultation.id}
                consultation={consultation}
                actionLabel={actionLabel}
                statusTone={statusTone}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed py-8 text-center">
            <p className="text-sm text-muted-foreground">{emptyText}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ConsultationRow({
  consultation,
  actionLabel,
  statusTone,
}: {
  consultation: Consultation
  actionLabel: string
  statusTone: 'active' | 'scheduled' | 'completed'
}) {
  return (
    <div className="flex flex-col gap-4 rounded-md border p-4 transition-colors hover:border-primary sm:flex-row sm:items-center sm:justify-between">
      <div className="grid gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={consultation.status} tone={statusTone} />
          <span className="text-sm text-muted-foreground">
            {formatDateTime(consultation.scheduledAt)}
          </span>
        </div>
        {consultation.notes && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {consultation.notes}
          </p>
        )}
      </div>
      <Link href={`/consultations/${consultation.id}`}>
        <Button
          variant={consultation.status === 'completed' ? 'outline' : 'default'}
          className="w-full sm:w-auto"
        >
          {actionLabel}
        </Button>
      </Link>
    </div>
  )
}

function ScheduleMiniItem({ consultation }: { consultation: Consultation }) {
  return (
    <Link
      href={`/consultations/${consultation.id}`}
      className="rounded-md border bg-background/80 p-3 transition-colors hover:border-primary"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">
            {new Date(consultation.scheduledAt).toLocaleDateString()}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(consultation.scheduledAt).toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
        </div>
        <StatusBadge
          status={consultation.status}
          tone={consultation.status === 'in-progress' ? 'active' : 'scheduled'}
        />
      </div>
    </Link>
  )
}

function ScheduleListItem({ consultation }: { consultation: Consultation }) {
  return (
    <Link
      href={`/consultations/${consultation.id}`}
      className="block rounded-md border p-4 transition-colors hover:border-primary"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">
            {new Date(consultation.scheduledAt).toLocaleDateString()}
          </p>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {new Date(consultation.scheduledAt).toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
        </div>
        <StatusBadge
          status={consultation.status}
          tone={consultation.status === 'in-progress' ? 'active' : 'scheduled'}
        />
      </div>
    </Link>
  )
}

function StatusBadge({
  status,
  tone,
}: {
  status: string
  tone: 'active' | 'scheduled' | 'completed'
}) {
  const className =
    tone === 'active'
      ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
      : tone === 'scheduled'
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
        : 'bg-muted text-muted-foreground'

  return <Badge className={className}>{status}</Badge>
}

function formatDateTime(value: string | Date) {
  const date = new Date(value)

  return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })}`
}
