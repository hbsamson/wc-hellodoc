import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  cancelConsultation,
  endConsultation,
  getConsultationWorkspace,
  rescheduleConsultation,
  saveConsultationNotes,
  savePrescription,
  startConsultation,
} from "@/app/actions/consultations";
import { savePatientMedicalFile } from "@/app/actions/medical-history";
import { ConsultationRoom } from "@/components/consultation-room";
import { ConsultationPersonalNotes } from "@/components/consultation-personal-notes";
import { Badge } from "@/components/ui/badge";
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
import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  ClipboardList,
  FileText,
  FolderOpen,
  Pill,
  Upload,
  UserRound,
  CheckCircle2,
  CircleX,
  Home,
} from "lucide-react";

interface ConsultationDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

type PatientSummary = {
  name: string | null;
  email: string;
  birthday: string | null;
  weightKg: string | null;
  heightCm: string | null;
  phoneNumber: string | null;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  medicalHistory: string | null;
};

type MedicalFile = {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  description: string | null;
  createdAt: Date;
};

export default async function ConsultationDetailPage({
  params,
}: ConsultationDetailPageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/sign-in");
  }

  const { id } = await params;
  const workspace = await getConsultationWorkspace(id);
  const {
    consultation,
    patient,
    doctor,
    consultationHistory,
    medicalFiles,
    prescription,
    isDoctor,
    isPatient,
  } = workspace;

  if (!isDoctor && !isPatient) {
    redirect("/consultations");
  }

  const roomName = `hellodoc-${consultation.id}`;
  const patientName = patient?.name || "Patient";
  const doctorName = doctor?.name || "Doctor";
  const displayName =
    session.user.name || (isDoctor ? `Dr. ${doctorName}` : patientName);

  return (
    <div className="min-h-screen bg-background xl:flex xl:h-[calc(100dvh-4rem)] xl:min-h-0 xl:flex-col xl:overflow-hidden">
      <div className="shrink-0 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex min-h-16 items-center justify-between gap-4 px-6 py-3 sm:px-8 lg:px-10">
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
          <Badge
            variant={
              consultation.status === "in-progress" ? "default" : "secondary"
            }
          >
            {consultation.status}
          </Badge>
        </div>
      </div>

      <main className="container mx-auto px-6 py-4 sm:px-8 lg:px-10 xl:min-h-0 xl:flex-1">
        {consultation.status === "scheduled" ||
        consultation.status === "in-progress" ? (
          <div className="grid gap-4 xl:h-full xl:min-h-0 xl:grid-cols-[minmax(0,1fr)_340px]">
            <ConsultationRoom
              consultationId={id}
              roomName={roomName}
              isLive={consultation.status === "in-progress"}
              isDoctor={isDoctor}
              displayName={displayName}
              waitingTitle={isDoctor ? "Patient waiting room" : "Waiting room"}
              waitingDescription={
                isDoctor
                  ? `${patientName} can enter once you let the patient in.`
                  : `${doctorName} will let you in when the consultation is ready.`
              }
            />
            {isDoctor ? (
              consultation.status === "scheduled" ? (
                <ScheduledDoctorPanel
                  consultationId={id}
                  patientName={patientName}
                  patient={patient}
                  medicalFiles={medicalFiles}
                  scheduledAt={consultation.scheduledAt}
                  doctorAvailability={{
                    availableFrom: doctor?.availableFrom,
                    availableUntil: doctor?.availableUntil,
                  }}
                />
              ) : (
                <DoctorWorkspace
                  consultationId={id}
                  patient={patient}
                  medicalFiles={medicalFiles}
                  history={consultationHistory}
                  notes={consultation.notes || ""}
                  prescription={prescription}
                />
              )
            ) : (
              <PatientSessionPanel
                consultationId={id}
                doctorName={doctorName}
                status={consultation.status}
                prescription={prescription}
                medicalFiles={medicalFiles}
              />
            )}
          </div>
        ) : consultation.status === "completed" ? (
          <CompletedSummary
            endedAt={consultation.endedAt}
            notes={consultation.notes}
            prescription={prescription}
          />
        ) : consultation.status === "cancelled" ? (
          <CancelledSummary />
        ) : null}
      </main>
    </div>
  );
}
function CompletedSummary({
  endedAt,
  notes,
  prescription,
}: {
  endedAt: Date | null;
  notes: string | null;
  prescription: {
    medications: string;
    instructions: string | null;
  } | null;
}) {
  return (
    <div className="mx-auto grid max-w-3xl gap-5 py-8">
      <Card className="overflow-hidden border-green-200 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 shadow-sm dark:border-green-900/50 dark:from-green-950/40 dark:via-emerald-950/30 dark:to-teal-950/20">
        <CardContent className="px-6 py-10 text-center sm:px-10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
            <CheckCircle2 className="h-9 w-9" />
          </div>

          <h2 className="text-2xl font-bold text-green-950 dark:text-green-100">
            Consultation Completed
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-green-800/80 dark:text-green-200/80">
            This consultation has ended. You can review the doctor’s notes and
            prescription below.
          </p>

          {endedAt && (
            <Badge
              variant="secondary"
              className="mt-4 bg-white/80 dark:bg-green-950/50 dark:text-green-100"
            >
              Ended on {new Date(endedAt).toLocaleString()}
            </Badge>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="h-5 w-5 text-primary" />
              Doctor Notes
            </CardTitle>
            <CardDescription>
              Summary and care notes from this consultation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notes ? (
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {notes}
              </p>
            ) : (
              <div className="rounded-md border border-dashed py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No notes were added for this consultation.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Pill className="h-5 w-5 text-primary" />
              Prescription
            </CardTitle>
            <CardDescription>
              Medication and instructions provided by the doctor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {prescription ? (
              <div className="grid gap-4 text-sm">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Medication
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">
                    {prescription.medications}
                  </p>
                </div>

                {prescription.instructions && (
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                      Instructions
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {prescription.instructions}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-md border border-dashed py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No prescription was issued.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CancelledSummary() {
  return (
    <div className="mx-auto max-w-2xl py-8">
      <Card className="overflow-hidden border-red-200 bg-gradient-to-br from-red-50 via-rose-50 to-orange-50 shadow-sm">
        <CardContent className="px-6 py-10 text-center sm:px-10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-700">
            <CircleX className="h-9 w-9" />
          </div>

          <h2 className="text-2xl font-bold text-red-950">
            Consultation Cancelled
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-red-800/80">
            This appointment has been cancelled. You may return to your
            consultations list or schedule another appointment.
          </p>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/consultations">
              <Button className="w-full sm:w-auto">
                <CalendarClock className="h-4 w-4" />
                Back to Consultations
              </Button>
            </Link>

            <Link href="/dashboard">
              <Button
                variant="outline"
                className="w-full bg-white/70 sm:w-auto"
              >
                <Home className="h-4 w-4" />
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ScheduledDoctorPanel({
  consultationId,
  patientName,
  patient,
  medicalFiles,
  scheduledAt,
  doctorAvailability,
}: {
  consultationId: string;
  patientName: string;
  patient: PatientSummary | null;
  medicalFiles: MedicalFile[];
  scheduledAt: Date;
  doctorAvailability: {
    availableFrom?: string | null;
    availableUntil?: string | null;
  };
}) {
  return (
    <aside className="grid content-start gap-3 pr-1 xl:max-h-full xl:overflow-y-auto">
      <Card>
        <CardHeader>
          <CardTitle>Waiting room</CardTitle>
          <CardDescription>
            {patientName} can join once you start the session.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async () => {
              "use server";
              await startConsultation(consultationId);
              redirect(`/consultations/${consultationId}`);
            }}
          >
            <Button className="w-full" type="submit">
              Let Patient In
            </Button>
          </form>
        </CardContent>
      </Card>

      <AppointmentScheduleCard
        consultationId={consultationId}
        scheduledAt={scheduledAt}
        doctorAvailability={doctorAvailability}
      />
      <PatientProfileCard patient={patient} />
      <MedicalFilesCard files={medicalFiles} />
    </aside>
  );
}

function DoctorWorkspace({
  consultationId,
  patient,
  medicalFiles,
  history,
  notes,
  prescription,
}: {
  consultationId: string;
  patient: PatientSummary | null;
  medicalFiles: MedicalFile[];
  history: {
    id: string;
    status: string;
    scheduledAt: Date;
    endedAt: Date | null;
    notes: string | null;
  }[];
  notes: string;
  prescription: {
    medications: string;
    instructions: string | null;
  } | null;
}) {
  return (
    <aside className="grid content-start gap-3 pr-1 xl:max-h-full xl:overflow-y-auto">
      <PatientProfileCard patient={patient} />
      <MedicalFilesCard files={medicalFiles} />

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
              "use server";
              await saveConsultationNotes(
                consultationId,
                String(formData.get("notes") || ""),
              );
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
                  "use server";
                  await endConsultation(
                    consultationId,
                    String(formData.get("notes") || ""),
                  );
                  redirect(`/consultations/${consultationId}`);
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
              "use server";
              await savePrescription(consultationId, {
                medications: String(formData.get("medications") || ""),
                instructions: String(formData.get("instructions") || ""),
              });
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="medications">Medication</Label>
              <Textarea
                id="medications"
                name="medications"
                defaultValue={prescription?.medications || ""}
                rows={4}
                placeholder="Medicine, dosage, frequency, duration"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="instructions">Instructions</Label>
              <Input
                id="instructions"
                name="instructions"
                defaultValue={prescription?.instructions || ""}
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
                <p className="mt-2 line-clamp-3 text-muted-foreground">
                  {item.notes}
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </aside>
  );
}

function PatientSessionPanel({
  consultationId,
  doctorName,
  status,
  prescription,
  medicalFiles,
}: {
  consultationId: string;
  doctorName: string;
  status: string;
  prescription: {
    medications: string;
    instructions: string | null;
  } | null;
  medicalFiles: MedicalFile[];
}) {
  return (
    <aside className="grid content-start gap-3 pr-1 xl:max-h-full xl:overflow-y-auto">
      <Card>
        <CardHeader>
          <CardTitle>
            {status === "scheduled" ? "Waiting room" : "Session details"}
          </CardTitle>
          <CardDescription>
            {status === "scheduled"
              ? `${doctorName} will let you in when the consultation is ready.`
              : `${doctorName} is connected to this consultation.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {status === "scheduled"
            ? "Keep this page open. Refresh if your doctor has started the session."
            : "Your doctor may add notes and prescriptions during or after the visit."}
        </CardContent>
      </Card>

      <PatientUploadCard consultationId={consultationId} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="h-5 w-5 text-primary" />
            Personal notes
          </CardTitle>
          <CardDescription>
            Notes stay in this browser for your own reference.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConsultationPersonalNotes consultationId={consultationId} />
        </CardContent>
      </Card>

      <MedicalFilesCard files={medicalFiles} />

      {prescription && (
        <Card>
          <CardHeader>
            <CardTitle>Prescription</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <p>{prescription.medications}</p>
            {prescription.instructions && (
              <p className="text-muted-foreground">
                {prescription.instructions}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </aside>
  );
}

function AppointmentScheduleCard({
  consultationId,
  scheduledAt,
  doctorAvailability,
}: {
  consultationId: string;
  scheduledAt: Date;
  doctorAvailability: {
    availableFrom?: string | null;
    availableUntil?: string | null;
  };
}) {
  const defaultDate = formatDateForInput(scheduledAt);
  const defaultTime = formatTimeForInput(scheduledAt);
  const minDate = formatDateForInput(new Date());
  const availabilityText =
    doctorAvailability.availableFrom && doctorAvailability.availableUntil
      ? `${doctorAvailability.availableFrom.slice(0, 5)}-${doctorAvailability.availableUntil.slice(0, 5)}`
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarClock className="h-5 w-5 text-primary" />
          Appointment Schedule
        </CardTitle>
        <CardDescription>
          {availabilityText
            ? `Doctor availability: ${availabilityText}`
            : "Choose a future 30-minute start time."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-3"
          action={async (formData) => {
            "use server";
            const date = String(formData.get("date") || "");
            const time = String(formData.get("time") || "");
            await rescheduleConsultation(
              consultationId,
              new Date(`${date}T${time}`).toISOString(),
            );
            redirect(`/consultations/${consultationId}`);
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
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
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            <Button type="submit" variant="outline">
              Reschedule
            </Button>
            <Button
              type="submit"
              variant="destructive"
              formNoValidate
              formAction={async () => {
                "use server";
                await cancelConsultation(consultationId);
                redirect("/consultations");
              }}
            >
              Cancel Appointment
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function PatientProfileCard({ patient }: { patient: PatientSummary | null }) {
  return (
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
        <Info
          label="Weight"
          value={patient?.weightKg ? `${patient.weightKg} kg` : null}
        />
        <Info
          label="Height"
          value={patient?.heightCm ? `${patient.heightCm} cm` : null}
        />
        <Info label="Phone" value={patient?.phoneNumber} />
        <Info label="Address" value={patient?.address} />
        <Info
          label="Emergency"
          value={
            patient?.emergencyContactName || patient?.emergencyContactPhone
              ? `${patient.emergencyContactName || ""} ${patient.emergencyContactPhone || ""}`.trim()
              : null
          }
        />
        <Info label="Medical history" value={patient?.medicalHistory} />
      </CardContent>
    </Card>
  );
}

function MedicalFilesCard({ files }: { files: MedicalFile[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FolderOpen className="h-5 w-5 text-primary" />
          Patient files
        </CardTitle>
        <CardDescription>
          Lab results and medical files shared by the patient.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {files.length === 0 ? (
          <div className="rounded-md border border-dashed py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No files uploaded yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {files.map((file) => (
              <div key={file.id} className="rounded-md border p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{file.filename}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatFileSize(file.size)} · {formatDate(file.createdAt)}
                    </p>
                    {file.description && (
                      <p className="mt-2 text-muted-foreground">
                        {file.description}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/api/patient-medical-history/file/${file.id}`}
                    target="_blank"
                  >
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PatientUploadCard({ consultationId }: { consultationId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Upload className="h-5 w-5 text-primary" />
          Upload lab results
        </CardTitle>
        <CardDescription>
          Share PDFs, images, or documents for your doctor to review.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-3"
          action={async (formData) => {
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

            const description = optionalString(formData.get("description"));
            await savePatientMedicalFile(file, description);
            redirect(`/consultations/${consultationId}`);
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="consultation-file">File</Label>
            <Input
              id="consultation-file"
              name="file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,.doc,.docx,application/pdf,image/jpeg,image/png,image/webp,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              required
            />
            <p className="text-xs text-muted-foreground">
              PDF, image, text, DOC, or DOCX up to 10MB.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="consultation-file-description">Notes</Label>
            <Textarea
              id="consultation-file-description"
              name="description"
              rows={3}
              placeholder="Example: CBC lab result from today"
            />
          </div>
          <Button type="submit" className="w-full">
            Upload File
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </p>
      <p className="whitespace-pre-wrap">{value || "Not provided"}</p>
    </div>
  );
}

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

function formatDateForInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatTimeForInput(date: Date) {
  return date.toTimeString().slice(0, 5);
}
