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
  User,
  FileDown,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { getUserRole } from "@/app/actions/helpers";
import {
  getDoctorPatientMedicalRecords,
  getDoctorPatientConsultationHistory,
  getDoctorPatientMedicalFiles,
  getDoctorPatientPrescriptions,
} from "@/app/actions/medical-history";
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

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function formatDateTime(value: string | Date) {
  const date = new Date(value);

  return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

export default async function PatientMedicalRecordsPage({
  params,
}: {
  params: { patientId: string };
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/sign-in");
  }

  const userRole = await getUserRole();
  if (userRole !== "doctor") {
    redirect("/dashboard");
  }

  const patientData = await getDoctorPatientMedicalRecords(params.patientId);
  if (!patientData) {
    redirect("/medical-records");
  }

  const consultationHistory = await getDoctorPatientConsultationHistory(
    params.patientId,
  );
  const medicalFiles = await getDoctorPatientMedicalFiles(params.patientId);
  const prescriptions = await getDoctorPatientPrescriptions(params.patientId);

  return (
    <div className="min-h-screen">
      <main className="container mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/medical-records">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Patient Medical Records</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section className="space-y-6">
            {/* Patient Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      NAME
                    </p>
                    <p className="mt-1 font-medium">
                      {patientData.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      EMAIL
                    </p>
                    <p className="mt-1 font-medium text-sm">
                      {patientData.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      PHONE
                    </p>
                    <p className="mt-1 font-medium">
                      {patientData.phoneNumber || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      DATE OF BIRTH
                    </p>
                    <p className="mt-1 font-medium">
                      {patientData.birthday
                        ? formatDate(patientData.birthday)
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      ADDRESS
                    </p>
                    <p className="mt-1 font-medium">
                      {patientData.address || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      WEIGHT
                    </p>
                    <p className="mt-1 font-medium">
                      {patientData.weightKg
                        ? `${patientData.weightKg} kg`
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      HEIGHT
                    </p>
                    <p className="mt-1 font-medium">
                      {patientData.heightCm
                        ? `${patientData.heightCm} cm`
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      EMERGENCY CONTACT
                    </p>
                    <p className="mt-1 font-medium">
                      {patientData.emergencyContactName || "N/A"}
                    </p>
                  </div>
                </div>
                {patientData.medicalHistory && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs font-semibold text-muted-foreground">
                      MEDICAL HISTORY
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm">
                      {patientData.medicalHistory}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Medical Files Section */}
            <div>
              <div className="mb-4">
                <h2 className="text-2xl font-bold">Medical Files</h2>
                <p className="text-sm text-muted-foreground">
                  Patient-uploaded medical documents and records.
                </p>
              </div>

              {medicalFiles.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center py-12 text-center">
                    <FolderOpen className="mb-4 h-10 w-10 text-muted-foreground" />
                    <p className="font-medium">No medical files</p>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                      This patient has not uploaded any medical files yet.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {medicalFiles.map((file) => (
                    <Card key={file.id}>
                      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {file.filename}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                              <span>{formatFileSize(file.size)}</span>
                              <span className="flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" />
                                {formatDate(file.createdAt)}
                              </span>
                            </div>
                            {file.description && (
                              <p className="mt-2 text-sm text-muted-foreground">
                                {file.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                          >
                            <FileDown className="h-4 w-4" />
                            View
                          </Button>
                        </a>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Consultation History Section */}
            <div>
              <div className="mb-4">
                <h2 className="text-2xl font-bold">Appointment History</h2>
                <p className="text-sm text-muted-foreground">
                  All consultations with this patient.
                </p>
              </div>

              {consultationHistory.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center py-12 text-center">
                    <Clock className="mb-4 h-10 w-10 text-muted-foreground" />
                    <p className="font-medium">No consultation history</p>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                      No consultations with this patient yet.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {consultationHistory.map((consultation) => (
                    <Card key={consultation.id}>
                      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant={
                                consultation.status === "completed"
                                  ? "default"
                                  : consultation.status === "scheduled"
                                    ? "secondary"
                                    : "outline"
                              }
                              className="capitalize"
                            >
                              {consultation.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {formatDateTime(consultation.scheduledAt)}
                            </span>
                          </div>
                          {consultation.notes && (
                            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                              {consultation.notes}
                            </p>
                          )}
                        </div>
                        <Link href={`/consultations/${consultation.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                          >
                            View Details
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Prescriptions Section */}
            <div>
              <div className="mb-4">
                <h2 className="text-2xl font-bold">Prescriptions</h2>
                <p className="text-sm text-muted-foreground">
                  Prescriptions issued during consultations with this patient.
                </p>
              </div>

              {prescriptions.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center py-12 text-center">
                    <Pill className="mb-4 h-10 w-10 text-muted-foreground" />
                    <p className="font-medium">No prescriptions</p>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                      No prescriptions have been issued to this patient yet.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {prescriptions.map((prescription) => (
                    <Card key={prescription.id}>
                      <CardContent className="flex flex-col gap-4 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">
                                Dr. {prescription.doctorName}
                              </p>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(prescription.consultationDate)}
                              </span>
                            </div>
                          </div>
                          <Badge variant="outline">
                            {formatDate(prescription.createdAt)}
                          </Badge>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground">
                              MEDICATIONS
                            </p>
                            <p className="mt-1 whitespace-pre-wrap text-sm">
                              {prescription.medications}
                            </p>
                          </div>
                          {prescription.instructions && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground">
                                INSTRUCTIONS
                              </p>
                              <p className="mt-1 text-sm">
                                {prescription.instructions}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Summary Card */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
              <CardDescription>Overview of patient records</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">
                  TOTAL CONSULTATIONS
                </p>
                <p className="mt-2 text-3xl font-bold">
                  {consultationHistory.length}
                </p>
              </div>

              <div className="border-t pt-4">
                <p className="text-xs font-semibold text-muted-foreground">
                  MEDICAL FILES
                </p>
                <p className="mt-2 text-3xl font-bold">{medicalFiles.length}</p>
              </div>

              <div className="border-t pt-4">
                <p className="text-xs font-semibold text-muted-foreground">
                  PRESCRIPTIONS
                </p>
                <p className="mt-2 text-3xl font-bold">
                  {prescriptions.length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
