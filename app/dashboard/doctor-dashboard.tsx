import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  FileSearch,
  NotebookPen,
  UserCog,
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
import { DoctorAvailabilityToggle } from "@/components/doctor-availability-toggle";

type Consultation = {
  id: string;
  status: string;
  scheduledAt: string | Date;
  endedAt?: string | Date | null;
  notes?: string | null;
};

type DoctorDashboardProps = {
  userName: string;
  consultations: Consultation[];
  isAvailable: boolean;
};

const doctorFeatures = [
  {
    title: "Medical Records Access",
    description:
      "Review patient context and uploaded medical history for consultations.",
    href: "/medical-records",
    action: "Review Records",
    icon: FileSearch,
  },
  {
    title: "Consultation Schedule Management",
    description:
      "Track upcoming, active, completed, and cancelled consultations.",
    href: "/consultations",
    action: "Manage Schedule",
    icon: CalendarDays,
  },
  {
    title: "Consultation Notes & Prescriptions",
    description: "Document care notes and prepare prescriptions after visits.",
    href: "/consultations",
    action: "Open Notes",
    icon: NotebookPen,
  },
  {
    title: "Consultation Session",
    description: "Start or join scheduled video consultations with patients.",
    href: "/consultations",
    action: "Open Sessions",
    icon: VideoIcon,
  },
];

export function DoctorDashboard({
  userName,
  consultations,
  isAvailable,
}: DoctorDashboardProps) {
  const upcomingConsultations = consultations.filter(
    (consultation) =>
      consultation.status === "scheduled" &&
      new Date(consultation.scheduledAt) > new Date(),
  );
  const activeConsultations = consultations.filter(
    (consultation) => consultation.status === "in-progress",
  );
  const completedConsultations = consultations.filter(
    (consultation) => consultation.status === "completed",
  );
  const scheduleItems = [...activeConsultations, ...upcomingConsultations];

  return (
    <main className="container mx-auto px-4 py-10">
      <section className="relative mb-10 overflow-hidden rounded-[2.5rem_1.25rem_2.75rem_1.5rem] border bg-[radial-gradient(circle_at_18%_20%,rgba(20,184,166,0.38),transparent_30%),radial-gradient(circle_at_82%_72%,rgba(45,212,191,0.32),transparent_34%),linear-gradient(135deg,rgba(240,253,250,0.96),rgba(204,251,241,0.78))] p-6 shadow-sm dark:bg-[radial-gradient(circle_at_18%_20%,rgba(20,184,166,0.22),transparent_30%),radial-gradient(circle_at_82%_72%,rgba(45,212,191,0.2),transparent_34%),linear-gradient(135deg,rgba(19,78,74,0.82),rgba(15,118,110,0.32))] sm:p-8">
        <div className="absolute -left-10 -top-8 h-32 w-32 rounded-full bg-teal-300/25 blur-2xl" />
        <div className="absolute -bottom-12 right-20 h-40 w-40 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-wide text-teal-800 dark:text-teal-100">
              Doctor Dashboard
            </p>
            <h1 className="mt-2 text-4xl font-bold text-teal-950 dark:text-white">
              Hello, Dr. {userName}
            </h1>

            {/* Availability toggle — Switch component */}
            <div className="mt-3">
              <DoctorAvailabilityToggle isAvailable={isAvailable} />
            </div>

            {/* Upcoming & Completed text */}
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-teal-700 dark:text-teal-200">
              <span>
                <strong className="font-semibold">
                  {upcomingConsultations.length}
                </strong>{" "}
                upcoming
              </span>
              <span>
                <strong className="font-semibold">
                  {completedConsultations.length}
                </strong>{" "}
                completed
              </span>
            </div>

            <div className="mt-5">
              <Link href="/doctor-profile">
                <Button
                  variant="outline"
                  className="gap-2 bg-white/80 dark:bg-background/80"
                >
                  <UserCog className="h-4 w-4" />
                  Edit Profile
                </Button>
              </Link>
            </div>
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

      <section className="mb-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {doctorFeatures.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Schedule</CardTitle>
            <CardDescription>
              Active and scheduled consultations that need attention.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {scheduleItems.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-muted-foreground">
                  No scheduled consultations right now.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {scheduleItems.map((consultation) => (
                  <div
                    key={consultation.id}
                    className="flex flex-col gap-4 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold capitalize">
                        {consultation.status}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(
                          consultation.scheduledAt,
                        ).toLocaleDateString()}{" "}
                        {new Date(
                          consultation.scheduledAt,
                        ).toLocaleTimeString()}
                      </p>
                    </div>
                    <Link href={`/consultations/${consultation.id}`}>
                      <Button>
                        {consultation.status === "in-progress"
                          ? "Join Session"
                          : "View Details"}
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
  );
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
  );
}

function MiniCalendar() {
  const dates = [
    ["1", "2", "3", "4", "5", "6", "7"],
    ["8", "9", "10", "11", "12", "13", "14"],
    ["15", "16", "17", "18", "19", "20", "21"],
    ["22", "23", "24", "25", "26", "27", "28"],
    ["29", "30", "31", "1", "2", "3", "4"],
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendar</CardTitle>
        <CardDescription>Monthly consultation overview</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 border-b pb-2 text-center text-[10px] text-muted-foreground">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="grid gap-y-4 pt-4">
          {dates.map((week, index) => (
            <div
              key={index}
              className="grid grid-cols-7 text-center text-sm font-medium"
            >
              {week.map((date, dateIndex) => (
                <span
                  key={`${index}-${dateIndex}`}
                  className={
                    dateIndex === 6
                      ? "text-destructive"
                      : index === 4 && dateIndex > 2
                        ? "text-muted-foreground"
                        : ""
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
  );
}