import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  FolderOpen,
  Pill,
  Clock,
  Users,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { getUserRole } from "@/app/actions/helpers";
import { getDoctorConsultations } from "@/app/actions/consultations";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function MedicalRecordsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/sign-in");
  }

  const userRole = await getUserRole();
  if (userRole !== "doctor") {
    redirect("/dashboard");
  }

  const consultations = await getDoctorConsultations();

  const uniquePatients = new Map();
  consultations.forEach((consultation) => {
    if (!uniquePatients.has(consultation.patientId)) {
      uniquePatients.set(consultation.patientId, {
        patientId: consultation.patientId,
        consultationCount: 0,
        lastConsultation: consultation.scheduledAt,
      });
    }
    const patient = uniquePatients.get(consultation.patientId);
    patient.consultationCount += 1;
    if (
      new Date(consultation.scheduledAt) > new Date(patient.lastConsultation)
    ) {
      patient.lastConsultation = consultation.scheduledAt;
    }
  });

  const patients = Array.from(uniquePatients.values()).sort(
    (a, b) =>
      new Date(b.lastConsultation).getTime() -
      new Date(a.lastConsultation).getTime(),
  );

  return (
    <div className="min-h-screen">
      <main className="container mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Medical Records</h1>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Patient Records
              </CardTitle>
              <CardDescription>
                Review consultation history, medical files, and prescriptions
                for your patients.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {patients.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <Users className="mb-4 h-10 w-10 text-muted-foreground" />
                  <p className="font-medium">No patient records yet</p>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    Your patient consultations will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {patients.map((patient) => (
                    <Link
                      key={patient.patientId}
                      href={`/medical-records/${patient.patientId}`}
                    >
                      <Card className="transition-colors hover:border-primary">
                        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                              <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                Patient ID: {patient.patientId}
                              </p>
                              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Last: {formatDate(patient.lastConsultation)}
                                </span>
                                <span>
                                  {patient.consultationCount} consultation(s)
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                          >
                            View Records
                          </Button>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
