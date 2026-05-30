import Image from "next/image";
import Link from "next/link";
import {
  Bot,
  CalendarCheck,
  FileText,
  HeartPulse,
  Search,
  ShieldPlus,
  VideoIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Consultation = {
  id: string;
  status: string;
  scheduledAt: string | Date;
  endedAt?: string | Date | null;
  notes?: string | null;
};

type PatientDashboardProps = {
  userName: string;
  consultations: Consultation[];
};

const patientFeatures = [
  {
    title: "Doctor Discovery",
    description: "Browse verified doctors by specialty and availability.",
    href: "/doctors",
    action: "Browse Doctors",
    icon: Search,
  },
  {
    title: "AI Recommendation",
    description: "Use symptoms and health context to guide your next step.",
    href: "/doctors",
    action: "Get Recommendation",
    icon: Bot,
  },
  {
    title: "Appointment Booking",
    description: "Book a consultation with the provider that fits your needs.",
    href: "/doctors",
    action: "Book Appointment",
    icon: CalendarCheck,
  },
  {
    title: "Consultation Session",
    description: "Join calls and review your consultation details.",
    href: "/consultations",
    action: "Open Consultations",
    icon: VideoIcon,
  },
  {
    title: "Medical Records",
    description: "Manage your profile, history, and uploaded medical files.",
    href: "/patient-medical-history",
    action: "View Records",
    icon: FileText,
  },
];

const commonSymptoms = [
  {
    title: "Headache",
    description: "Review care options and possible next steps.",
    icon: HeartPulse,
  },
  {
    title: "Fever",
    description: "Find the right consultation path based on severity.",
    icon: ShieldPlus,
  },
  {
    title: "Cough",
    description: "Get matched to a provider for respiratory concerns.",
    icon: Bot,
  },
];

export function PatientDashboard({
  userName,
  consultations,
}: PatientDashboardProps) {
  const upcomingConsultations = consultations.filter(
    (consultation) =>
      consultation.status === "scheduled" &&
      new Date(consultation.scheduledAt) > new Date(),
  );
  const firstUpcoming = upcomingConsultations[0];

  return (
    <main className="container mx-auto px-6 py-10 sm:px-8 lg:px-10">
      <section className="relative mb-10 overflow-hidden rounded-[2.5rem_1.25rem_2.75rem_1.5rem] border bg-[radial-gradient(circle_at_18%_20%,rgba(20,184,166,0.38),transparent_30%),radial-gradient(circle_at_82%_72%,rgba(45,212,191,0.32),transparent_34%),linear-gradient(135deg,rgba(240,253,250,0.96),rgba(204,251,241,0.78))] p-6 shadow-sm dark:bg-[radial-gradient(circle_at_18%_20%,rgba(20,184,166,0.22),transparent_30%),radial-gradient(circle_at_82%_72%,rgba(45,212,191,0.2),transparent_34%),linear-gradient(135deg,rgba(19,78,74,0.82),rgba(15,118,110,0.32))] sm:p-8">
        <div className="absolute -left-10 -top-8 h-32 w-32 rounded-full bg-teal-300/25 blur-2xl" />
        <div className="absolute -bottom-12 right-20 h-40 w-40 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-wide text-teal-800 dark:text-teal-100">
              Patient Dashboard
            </p>
            <h1 className="mt-2 text-4xl font-bold text-teal-950 dark:text-white">
              Hello, {userName}
            </h1>
            <p className="mt-2 text-teal-950/70 dark:text-teal-50/80">
              {firstUpcoming
                ? `Your next consultation is on ${new Date(firstUpcoming.scheduledAt).toLocaleDateString()}.`
                : "Find care, book appointments, and keep your records ready."}
            </p>
            <Link href="/consultations" className="mt-5 inline-flex">
              <Button className="gap-2">
                <CalendarCheck className="h-4 w-4" />
                Consult a doctor
              </Button>
            </Link>
          </div>

          <div className="relative flex items-end justify-center lg:min-w-72">
            <div className="absolute left-2 top-2 rounded-full bg-white/85 px-4 py-2 text-sm font-bold text-teal-900 shadow-sm dark:bg-background/85 dark:text-teal-100">
              Hello!
            </div>
            <Image
              src="/1.png"
              alt="HelloDoc assistant saying hello"
              width={280}
              height={280}
              className="relative max-h-64 w-auto object-contain"
              priority
            />
          </div>
        </div>
      </section>

      <section className="mb-10">
        <Card>
          <CardHeader>
            <CardTitle>Find Your Doctor</CardTitle>
            <CardDescription>
              Search available providers and start doctor discovery.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action="/doctors" className="flex flex-col gap-3 sm:flex-row">
              <input
                name="q"
                placeholder="Search by specialty, symptom, or doctor name"
                className="min-h-10 flex-1 rounded-md border bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button type="submit" className="w-full gap-2 sm:w-auto">
                <Search className="h-4 w-4" />
                Search
              </Button>
            </form>
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
            const Icon = symptom.icon;

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
            );
          })}
        </div>
      </section>

      <ConsultationList consultations={upcomingConsultations} />
    </main>
  );
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
  );
}

function ConsultationList({
  consultations,
}: {
  consultations: Consultation[];
}) {
  return (
    <section>
      <h2 className="mb-4 text-2xl font-bold">Upcoming Consultations</h2>
      {consultations.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="mb-4 text-muted-foreground">
              No upcoming consultations.
            </p>
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
  );
}
