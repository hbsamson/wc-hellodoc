import Link from 'next/link'
import {
  CalendarDays,
  FileSearch,
  NotebookPen,
  UserCog,
  VideoIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type Consultation = {
  id: string
  status: string
  scheduledAt: string | Date
  endedAt?: string | Date | null
  notes?: string | null
}

type DoctorDashboardProps = {
  userName: string
  consultations: Consultation[]
}

const doctorFeatures = [
  {
    title: 'Medical Records Access',
    description: 'Review patient context and uploaded medical history for consultations.',
    href: '/consultations',
    action: 'Review Records',
    icon: FileSearch,
  },
  {
    title: 'Consultation Schedule Management',
    description: 'Track upcoming, active, completed, and cancelled consultations.',
    href: '/consultations',
    action: 'Manage Schedule',
    icon: CalendarDays,
  },
  {
    title: 'Consultation Notes & Prescriptions',
    description: 'Document care notes and prepare prescriptions after visits.',
    href: '/consultations',
    action: 'Open Notes',
    icon: NotebookPen,
  },
  {
    title: 'Consultation Session',
    description: 'Start or join scheduled video consultations with patients.',
    href: '/consultations',
    action: 'Open Sessions',
    icon: VideoIcon,
  },
]

export function DoctorDashboard({ userName, consultations }: DoctorDashboardProps) {
  const upcomingConsultations = consultations.filter(
    (consultation) =>
      consultation.status === 'scheduled' &&
      new Date(consultation.scheduledAt) > new Date(),
  )
  const activeConsultations = consultations.filter(
    (consultation) => consultation.status === 'in-progress',
  )
  const completedConsultations = consultations.filter(
    (consultation) => consultation.status === 'completed',
  )
  const scheduleItems = [...activeConsultations, ...upcomingConsultations]

  return (
    <main className="container mx-auto px-4 py-10">
      <section className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-primary">
            Doctor Dashboard
          </p>
          <h1 className="mt-2 text-4xl font-bold">Hello, Dr. {userName}</h1>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
            <span className="h-2 w-2 rounded-full bg-green-600" />
            Available
          </div>
        </div>
        <Link href="/doctor-profile">
          <Button variant="outline" className="gap-2">
            <UserCog className="h-4 w-4" />
            Edit Profile
          </Button>
        </Link>
      </section>

      <section className="mb-8 grid gap-4 md:grid-cols-4">
        <SummaryCard title="Active" value={activeConsultations.length} label="Live consultations" />
        <SummaryCard title="Upcoming" value={upcomingConsultations.length} label="Scheduled visits" />
        <SummaryCard title="Completed" value={completedConsultations.length} label="Finished visits" />
        <SummaryCard title="Availability" value="Open" label="Profile status" />
      </section>

      <section className="mb-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {doctorFeatures.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Schedule</CardTitle>
            <CardDescription>Active and scheduled consultations that need attention.</CardDescription>
          </CardHeader>
          <CardContent>
            {scheduleItems.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-muted-foreground">No scheduled consultations right now.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {scheduleItems.map((consultation) => (
                  <div
                    key={consultation.id}
                    className="flex flex-col gap-4 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold capitalize">{consultation.status}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(consultation.scheduledAt).toLocaleDateString()}{' '}
                        {new Date(consultation.scheduledAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <Link href={`/consultations/${consultation.id}`}>
                      <Button>
                        {consultation.status === 'in-progress' ? 'Join Session' : 'View Details'}
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <MiniCalendar />
      </section>
    </main>
  )
}

function SummaryCard({
  title,
  value,
  label,
}: {
  title: string
  value: number | string
  label: string
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="mt-2 text-3xl font-bold">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}

function FeatureCard({
  title,
  description,
  href,
  action,
  icon: Icon,
}: (typeof doctorFeatures)[number]) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto">
        <Link href={href}>
          <Button className="w-full">{action}</Button>
        </Link>
      </CardContent>
    </Card>
  )
}

function MiniCalendar() {
  const dates = [
    ['1', '2', '3', '4', '5', '6', '7'],
    ['8', '9', '10', '11', '12', '13', '14'],
    ['15', '16', '17', '18', '19', '20', '21'],
    ['22', '23', '24', '25', '26', '27', '28'],
    ['29', '30', '31', '1', '2', '3', '4'],
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendar</CardTitle>
        <CardDescription>Monthly consultation overview</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 border-b pb-2 text-center text-[10px] text-muted-foreground">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="grid gap-y-4 pt-4">
          {dates.map((week, index) => (
            <div key={index} className="grid grid-cols-7 text-center text-sm font-medium">
              {week.map((date, dateIndex) => (
                <span
                  key={`${index}-${dateIndex}`}
                  className={
                    dateIndex === 6
                      ? 'text-destructive'
                      : index === 4 && dateIndex > 2
                        ? 'text-muted-foreground'
                        : ''
                  }
                >
                  {date}
                </span>
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
