import Link from 'next/link'
import {
  Bot,
  CalendarCheck,
  FileText,
  HeartPulse,
  Search,
  ShieldPlus,
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

type PatientDashboardProps = {
  userName: string
  consultations: Consultation[]
}

const patientFeatures = [
  {
    title: 'Doctor Discovery',
    description: 'Browse verified doctors by specialty and availability.',
    href: '/doctors',
    action: 'Browse Doctors',
    icon: Search,
  },
  {
    title: 'AI Recommendation',
    description: 'Use symptoms and health context to guide your next step.',
    href: '/doctors',
    action: 'Get Recommendation',
    icon: Bot,
  },
  {
    title: 'Appointment Booking',
    description: 'Book a consultation with the provider that fits your needs.',
    href: '/doctors',
    action: 'Book Appointment',
    icon: CalendarCheck,
  },
  {
    title: 'Consultation Session',
    description: 'Join calls and review your consultation details.',
    href: '/consultations',
    action: 'Open Consultations',
    icon: VideoIcon,
  },
  {
    title: 'Medical Records',
    description: 'Manage your profile, history, and uploaded medical files.',
    href: '/patient-medical-history',
    action: 'View Records',
    icon: FileText,
  },
]

const commonSymptoms = [
  {
    title: 'Headache',
    description: 'Review care options and possible next steps.',
    icon: HeartPulse,
  },
  {
    title: 'Fever',
    description: 'Find the right consultation path based on severity.',
    icon: ShieldPlus,
  },
  {
    title: 'Cough',
    description: 'Get matched to a provider for respiratory concerns.',
    icon: Bot,
  },
]

export function PatientDashboard({ userName, consultations }: PatientDashboardProps) {
  const upcomingConsultations = consultations.filter(
    (consultation) =>
      consultation.status === 'scheduled' &&
      new Date(consultation.scheduledAt) > new Date(),
  )
  const completedConsultations = consultations.filter(
    (consultation) => consultation.status === 'completed',
  )
  const firstUpcoming = upcomingConsultations[0]

  return (
    <main className="container mx-auto px-4 py-10">
      <section className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-primary">
            Patient Dashboard
          </p>
          <h1 className="mt-2 text-4xl font-bold">Hello, {userName}</h1>
          <p className="mt-2 text-muted-foreground">
            {firstUpcoming
              ? `Your next consultation is on ${new Date(firstUpcoming.scheduledAt).toLocaleDateString()}.`
              : 'Find care, book appointments, and keep your records ready.'}
          </p>
        </div>
        <Link href="/consultations">
          <Button className="gap-2">
            <CalendarCheck className="h-4 w-4" />
            View Consultations
          </Button>
        </Link>
      </section>

      <section className="mb-8 grid gap-4 md:grid-cols-3">
        <SummaryCard title="Upcoming" value={upcomingConsultations.length} label="Scheduled consultations" />
        <SummaryCard title="Completed" value={completedConsultations.length} label="Finished consultations" />
        <SummaryCard title="Records" value="Ready" label="Profile and medical history" />
      </section>

      <section className="mb-10">
        <Card>
          <CardHeader>
            <CardTitle>Find Your Doctor</CardTitle>
            <CardDescription>Search available providers and start doctor discovery.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                placeholder="Search by specialty, symptom, or doctor name"
                className="min-h-10 flex-1 rounded-md border bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Link href="/doctors">
                <Button className="w-full gap-2 sm:w-auto">
                  <Search className="h-4 w-4" />
                  Search
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-2xl font-bold">Care Tools</h2>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {patientFeatures.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-2xl font-bold">Common Symptoms</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {commonSymptoms.map((symptom) => {
            const Icon = symptom.icon

            return (
              <Card key={symptom.title}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className="h-5 w-5 text-primary" />
                    {symptom.title}
                  </CardTitle>
                  <CardDescription>{symptom.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/doctors">
                    <Button variant="outline" className="w-full">
                      Find Care
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      <ConsultationList consultations={upcomingConsultations} />
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
}: (typeof patientFeatures)[number]) {
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

function ConsultationList({ consultations }: { consultations: Consultation[] }) {
  return (
    <section>
      <h2 className="mb-4 text-2xl font-bold">Upcoming Consultations</h2>
      {consultations.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="mb-4 text-muted-foreground">No upcoming consultations.</p>
            <Link href="/doctors">
              <Button>Browse Doctors</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {consultations.map((consultation) => (
            <Card key={consultation.id}>
              <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">
                    {new Date(consultation.scheduledAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(consultation.scheduledAt).toLocaleTimeString()}
                  </p>
                </div>
                <Link href={`/consultations/${consultation.id}`}>
                  <Button>View Details</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
