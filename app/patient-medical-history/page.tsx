import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  FolderOpen,
  Upload,
  Pill,
  Clock,
} from "lucide-react";
import { auth } from "@/lib/auth";
import {
  getPatientMedicalFiles,
  savePatientMedicalFile,
  getPatientConsultationHistory,
  getPatientPrescriptions,
} from "@/app/actions/medical-history";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

function optionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }

  return value.trim();
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

async function validateAndSaveMedicalFile(formData: FormData) {
  "use server";

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Please choose a medical file to upload");
  }

  const allowedTypes = new Set([
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]);

  if (!allowedTypes.has(file.type)) {
    throw new Error("Upload a PDF, image, text, DOC, or DOCX file");
  }

  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error("Medical files must be 10MB or smaller");
  }

  await savePatientMedicalFile(
    file,
    optionalString(formData.get("description")),
  );
  redirect("/patient-medical-history");
}

export default async function PatientMedicalHistoryPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/sign-in");
  }

  const files = await getPatientMedicalFiles();
  const consultationHistory = await getPatientConsultationHistory();
  const prescriptions = await getPatientPrescriptions();

  return (
    <div className="min-h-screen">
      <main className="container mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/patient-profile">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Medical History</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="space-y-6">
            {/* Historical Files Section */}
            <div>
              <div className="mb-4">
                <h2 className="text-2xl font-bold">Uploaded Records</h2>
                <p className="text-sm text-muted-foreground">
                  View prescriptions and medical documents you have uploaded.
                </p>
              </div>

              {files.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center py-12 text-center">
                    <FolderOpen className="mb-4 h-10 w-10 text-muted-foreground" />
                    <p className="font-medium">No medical files yet</p>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                      Upload old prescriptions, lab results, referrals, or other
                      records so they are ready for future consultations.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {files.map((file) => (
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
                        <Link href={file.url} target="_blank">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                          >
                            View
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Consultation History Section */}
            <div>
              <div className="mb-4">
                <h2 className="text-2xl font-bold">Consultation History</h2>
                <p className="text-sm text-muted-foreground">
                  Review your previous consultations with doctors.
                </p>
              </div>

              {consultationHistory.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center py-12 text-center">
                    <Clock className="mb-4 h-10 w-10 text-muted-foreground" />
                    <p className="font-medium">No consultations yet</p>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                      Your past consultations will appear here.
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
                            <p className="font-medium">
                              Dr. {consultation.doctorName}
                            </p>
                            {consultation.specialty && (
                              <Badge variant="secondary" className="text-xs">
                                {consultation.specialty}
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {formatDate(consultation.scheduledAt)}
                            {consultation.startedAt && (
                              <span className="ml-2">
                                (
                                {new Date(
                                  consultation.startedAt,
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                                )
                              </span>
                            )}
                          </p>
                          {consultation.notes && (
                            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                              {consultation.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-start gap-2 sm:items-end">
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
                          <Link href={`/consultations/${consultation.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full sm:w-auto"
                            >
                              View Details
                            </Button>
                          </Link>
                        </div>
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
                  View prescriptions from your completed consultations.
                </p>
              </div>

              {prescriptions.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center py-12 text-center">
                    <Pill className="mb-4 h-10 w-10 text-muted-foreground" />
                    <p className="font-medium">No prescriptions yet</p>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                      Prescriptions from your consultations will appear here.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {prescriptions.map((prescription) => (
                    <Card key={prescription.id}>
                      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">
                              Dr. {prescription.doctorName}
                            </p>
                            {prescription.doctorSpecialty && (
                              <Badge variant="secondary" className="text-xs">
                                {prescription.doctorSpecialty}
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {formatDate(prescription.consultationDate)}
                          </p>
                          <div className="mt-3 space-y-2">
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
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </section>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Upload File
              </CardTitle>
              <CardDescription>
                Add prescriptions, medical certificates, lab results, or related
                files.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={validateAndSaveMedicalFile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file">Medical file</Label>
                  <Input
                    id="file"
                    name="file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,.doc,.docx,application/pdf,image/jpeg,image/png,image/webp,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    PDF, image, text, DOC, or DOCX up to 10MB.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Notes</Label>
                  <Textarea
                    id="description"
                    name="description"
                    rows={4}
                    placeholder="Example: Prescription from previous checkup"
                  />
                </div>

                <Button type="submit" className="w-full">
                  <Upload className="h-4 w-4" />
                  Upload Medical File
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
