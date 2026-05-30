"use server";

import { db } from "@/lib/db";
import {
  consultations,
  patientMedicalFiles,
  prescriptions,
  user,
} from "@/lib/db/schema";
import {
  CONSULTATION_BLOCK_MINUTES,
  isThirtyMinuteBlock,
  isWithinDoctorAvailability,
} from "@/lib/consultation-scheduling";
import {
  eq,
  and,
  desc,
  gte,
  inArray,
  isNotNull,
  lt,
  ne,
  or,
} from "drizzle-orm";
import { getUserId } from "./helpers";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { createDailyRoom, getMeetingToken } from "@/lib/daily";

export async function bookConsultation(data: {
  doctorId: string;
  scheduledAt: string;
}) {
  const userId = await getUserId();
  const scheduledDate = new Date(data.scheduledAt);

  if (Number.isNaN(scheduledDate.getTime())) {
    throw new Error("Invalid scheduled time");
  }

  if (scheduledDate <= new Date()) {
    throw new Error("Cannot book consultation in the past");
  }

  if (!isThirtyMinuteBlock(scheduledDate)) {
    throw new Error("Consultations must start on a 30-minute block");
  }

  const doctor = await db
    .select({
      id: user.id,
      isAvailable: user.isAvailable,
      availableFrom: user.availableFrom,
      availableUntil: user.availableUntil,
    })
    .from(user)
    .where(and(eq(user.id, data.doctorId), isNotNull(user.specialty)))
    .limit(1);

  if (!doctor[0]) {
    throw new Error("Doctor not found");
  }

  if (!doctor[0].isAvailable) {
    throw new Error("Doctor is not available for booking");
  }

  if (
    !isWithinDoctorAvailability(
      scheduledDate,
      doctor[0].availableFrom,
      doctor[0].availableUntil,
    )
  ) {
    throw new Error("Selected time is outside doctor availability");
  }

  const slotEnd = new Date(
    scheduledDate.getTime() + CONSULTATION_BLOCK_MINUTES * 60 * 1000,
  );
  const conflictWindowStart = new Date(
    scheduledDate.getTime() - (CONSULTATION_BLOCK_MINUTES - 1) * 60 * 1000,
  );

  const existingConsultation = await db
    .select({ id: consultations.id })
    .from(consultations)
    .where(
      and(
        eq(consultations.doctorId, data.doctorId),
        inArray(consultations.status, ["scheduled", "in-progress"]),
        gte(consultations.scheduledAt, conflictWindowStart),
        lt(consultations.scheduledAt, slotEnd),
      ),
    )
    .limit(1);

  if (existingConsultation[0]) {
    throw new Error("Doctor already has a consultation at that time");
  }

  const consultation = await db
    .insert(consultations)
    .values({
      id: nanoid(),
      patientId: userId,
      doctorId: data.doctorId,
      scheduledAt: scheduledDate,
      status: "scheduled",
    })
    .returning();

  revalidatePath("/consultations");
  revalidatePath("/dashboard");
  return consultation[0];
}

export async function getPatientConsultations() {
  const userId = await getUserId();

  const patientConsultations = await db
    .select({
      id: consultations.id,
      patientId: consultations.patientId,
      doctorId: consultations.doctorId,
      scheduledAt: consultations.scheduledAt,
      status: consultations.status,
      startedAt: consultations.startedAt,
      endedAt: consultations.endedAt,
      notes: consultations.notes,
      prescriptionId: consultations.prescriptionId,
      createdAt: consultations.createdAt,
      updatedAt: consultations.updatedAt,

      doctorName: user.name,
      doctorEmail: user.email,
      doctorSpecialty: user.specialty,
    })
    .from(consultations)
    .innerJoin(user, eq(consultations.doctorId, user.id))
    .where(eq(consultations.patientId, userId))
    .orderBy(desc(consultations.scheduledAt));

  return patientConsultations;
}

export async function getDoctorConsultations() {
  const userId = await getUserId();

  const doctorConsultations = await db
    .select({
      id: consultations.id,
      patientId: consultations.patientId,
      doctorId: consultations.doctorId,
      scheduledAt: consultations.scheduledAt,
      status: consultations.status,
      startedAt: consultations.startedAt,
      endedAt: consultations.endedAt,
      notes: consultations.notes,
      prescriptionId: consultations.prescriptionId,
      createdAt: consultations.createdAt,
      updatedAt: consultations.updatedAt,

      patientName: user.name,
      patientEmail: user.email,
    })
    .from(consultations)
    .innerJoin(user, eq(consultations.patientId, user.id))
    .where(eq(consultations.doctorId, userId))
    .orderBy(desc(consultations.scheduledAt));

  return doctorConsultations;
}

export async function getConsultation(consultationId: string) {
  const userId = await getUserId();

  const consultation = await db
    .select()
    .from(consultations)
    .where(
      and(
        eq(consultations.id, consultationId),
        or(
          eq(consultations.patientId, userId),
          eq(consultations.doctorId, userId),
        ),
      ),
    )
    .limit(1);

  if (!consultation[0]) {
    throw new Error("Consultation not found");
  }

  // Verify user is participant
  if (
    consultation[0].patientId !== userId &&
    consultation[0].doctorId !== userId
  ) {
    throw new Error("Unauthorized");
  }

  return consultation[0];
}

export async function getConsultationWorkspace(consultationId: string) {
  const consultation = await getConsultation(consultationId);
  const userId = await getUserId();

  const [patient] = await db
    .select({
      id: user.id,
      name: user.name,
      givenName: user.givenName,
      lastName: user.lastName,
      email: user.email,
      birthday: user.birthday,
      weightKg: user.weightKg,
      heightCm: user.heightCm,
      phoneNumber: user.phoneNumber,
      address: user.address,
      emergencyContactName: user.emergencyContactName,
      emergencyContactPhone: user.emergencyContactPhone,
      medicalHistory: user.medicalHistory,
    })
    .from(user)
    .where(eq(user.id, consultation.patientId))
    .limit(1);

  const [doctor] = await db
    .select({
      id: user.id,
      name: user.name,
      specialty: user.specialty,
      isAvailable: user.isAvailable,
      availableFrom: user.availableFrom,
      availableUntil: user.availableUntil,
    })
    .from(user)
    .where(eq(user.id, consultation.doctorId))
    .limit(1);

  const consultationHistory = await db
    .select({
      id: consultations.id,
      status: consultations.status,
      scheduledAt: consultations.scheduledAt,
      endedAt: consultations.endedAt,
      notes: consultations.notes,
    })
    .from(consultations)
    .where(
      and(
        eq(consultations.patientId, consultation.patientId),
        eq(consultations.doctorId, consultation.doctorId),
      ),
    )
    .orderBy(desc(consultations.scheduledAt));

  const [prescription] = await db
    .select()
    .from(prescriptions)
    .where(eq(prescriptions.consultationId, consultation.id))
    .limit(1);

  const medicalFiles = await db
    .select({
      id: patientMedicalFiles.id,
      filename: patientMedicalFiles.filename,
      mimeType: patientMedicalFiles.mimeType,
      size: patientMedicalFiles.size,
      description: patientMedicalFiles.description,
      createdAt: patientMedicalFiles.createdAt,
    })
    .from(patientMedicalFiles)
    .where(eq(patientMedicalFiles.userId, consultation.patientId))
    .orderBy(desc(patientMedicalFiles.createdAt));

  return {
    consultation,
    patient,
    doctor,
    consultationHistory,
    medicalFiles,
    prescription: prescription || null,
    isDoctor: consultation.doctorId === userId,
    isPatient: consultation.patientId === userId,
  };
}

export async function startConsultation(consultationId: string) {
  const userId = await getUserId();
  const consultation = await getConsultation(consultationId);

  if (consultation.doctorId !== userId) {
    throw new Error("Only doctor can start consultation");
  }

  // Create a Daily.co room so the video call works immediately
  const roomName = `hellodoc-${consultation.id}`;
  await createDailyRoom(roomName);

  const updated = await db
    .update(consultations)
    .set({
      status: "in-progress",
      startedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(consultations.id, consultationId))
    .returning();

  revalidatePath("/consultations");
  revalidatePath(`/consultations/${consultationId}`);
  return updated[0];
}

/**
 * Returns a Daily.co meeting token for the current user so they can
 * join the room with their display name pre-filled (no name prompt).
 */
export async function getConsultationToken(consultationId: string) {
  const userId = await getUserId();
  const consultation = await getConsultation(consultationId);

  const isDoctor = consultation.doctorId === userId;
  const roomName = `hellodoc-${consultation.id}`;

  // Look up the participant's display name
  const [participant] = await db
    .select({ name: user.name })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  const userName = participant?.name || "Guest";

  const token = await getMeetingToken(roomName, userName, isDoctor);
  return token;
}

export async function endConsultation(consultationId: string, notes?: string) {
  const userId = await getUserId();
  const consultation = await getConsultation(consultationId);

  if (consultation.doctorId !== userId) {
    throw new Error("Only doctor can end consultation");
  }

  const updated = await db
    .update(consultations)
    .set({
      status: "completed",
      endedAt: new Date(),
      notes: notes,
      updatedAt: new Date(),
    })
    .where(eq(consultations.id, consultationId))
    .returning();

  revalidatePath("/consultations");
  return updated[0];
}

export async function saveConsultationNotes(
  consultationId: string,
  notes: string,
) {
  const userId = await getUserId();
  const consultation = await getConsultation(consultationId);

  if (consultation.doctorId !== userId) {
    throw new Error("Only doctor can update consultation notes");
  }

  const updated = await db
    .update(consultations)
    .set({
      notes,
      updatedAt: new Date(),
    })
    .where(eq(consultations.id, consultationId))
    .returning();

  revalidatePath("/consultations");
  revalidatePath(`/consultations/${consultationId}`);
  return updated[0];
}

export async function savePrescription(
  consultationId: string,
  data: {
    medications: string;
    instructions?: string;
  },
) {
  const userId = await getUserId();
  const consultation = await getConsultation(consultationId);

  if (consultation.doctorId !== userId) {
    throw new Error("Only doctor can create prescriptions");
  }

  if (!data.medications.trim()) {
    throw new Error("Medication details are required");
  }

  const existing = await db
    .select({ id: prescriptions.id })
    .from(prescriptions)
    .where(eq(prescriptions.consultationId, consultationId))
    .limit(1);

  const prescription = existing[0]
    ? await db
        .update(prescriptions)
        .set({
          medications: data.medications,
          instructions: data.instructions,
          updatedAt: new Date(),
        })
        .where(eq(prescriptions.id, existing[0].id))
        .returning()
    : await db
        .insert(prescriptions)
        .values({
          id: nanoid(),
          consultationId,
          patientId: consultation.patientId,
          doctorId: consultation.doctorId,
          medications: data.medications,
          instructions: data.instructions,
        })
        .returning();

  await db
    .update(consultations)
    .set({
      prescriptionId: prescription[0].id,
      updatedAt: new Date(),
    })
    .where(eq(consultations.id, consultationId));

  revalidatePath("/consultations");
  revalidatePath(`/consultations/${consultationId}`);
  return prescription[0];
}

export async function cancelConsultation(consultationId: string) {
  await getConsultation(consultationId);

  // Allow cancellation by patient or doctor
  const updated = await db
    .update(consultations)
    .set({
      status: "cancelled",
      updatedAt: new Date(),
    })
    .where(eq(consultations.id, consultationId))
    .returning();

  revalidatePath("/consultations");
  revalidatePath(`/consultations/${consultationId}`);
  revalidatePath("/notifications");
  return updated[0];
}

export async function rescheduleConsultation(
  consultationId: string,
  scheduledAt: string,
) {
  const consultation = await getConsultation(consultationId);
  const scheduledDate = new Date(scheduledAt);

  if (consultation.status !== "scheduled") {
    throw new Error("Only scheduled consultations can be rescheduled");
  }

  if (Number.isNaN(scheduledDate.getTime())) {
    throw new Error("Invalid scheduled time");
  }

  if (scheduledDate <= new Date()) {
    throw new Error("Cannot reschedule consultation in the past");
  }

  if (!isThirtyMinuteBlock(scheduledDate)) {
    throw new Error("Consultations must start on a 30-minute block");
  }

  const doctor = await db
    .select({
      id: user.id,
      isAvailable: user.isAvailable,
      availableFrom: user.availableFrom,
      availableUntil: user.availableUntil,
    })
    .from(user)
    .where(and(eq(user.id, consultation.doctorId), isNotNull(user.specialty)))
    .limit(1);

  if (!doctor[0]) {
    throw new Error("Doctor not found");
  }

  if (!doctor[0].isAvailable) {
    throw new Error("Doctor is not available for booking");
  }

  if (
    !isWithinDoctorAvailability(
      scheduledDate,
      doctor[0].availableFrom,
      doctor[0].availableUntil,
    )
  ) {
    throw new Error("Selected time is outside doctor availability");
  }

  const slotEnd = new Date(
    scheduledDate.getTime() + CONSULTATION_BLOCK_MINUTES * 60 * 1000,
  );
  const conflictWindowStart = new Date(
    scheduledDate.getTime() - (CONSULTATION_BLOCK_MINUTES - 1) * 60 * 1000,
  );

  const existingConsultation = await db
    .select({ id: consultations.id })
    .from(consultations)
    .where(
      and(
        eq(consultations.doctorId, consultation.doctorId),
        ne(consultations.id, consultationId),
        inArray(consultations.status, ["scheduled", "in-progress"]),
        gte(consultations.scheduledAt, conflictWindowStart),
        lt(consultations.scheduledAt, slotEnd),
      ),
    )
    .limit(1);

  if (existingConsultation[0]) {
    throw new Error("Doctor already has a consultation at that time");
  }

  const updated = await db
    .update(consultations)
    .set({
      scheduledAt: scheduledDate,
      updatedAt: new Date(),
    })
    .where(eq(consultations.id, consultationId))
    .returning();

  revalidatePath("/consultations");
  revalidatePath(`/consultations/${consultationId}`);
  revalidatePath("/dashboard");
  revalidatePath("/notifications");
  return updated[0];
}

export async function getUpcomingConsultations() {
  const userId = await getUserId();
  const now = new Date();

  const upcoming = await db
    .select()
    .from(consultations)
    .where(
      and(
        gte(consultations.scheduledAt, now),
        eq(consultations.status, "scheduled"),
        or(
          eq(consultations.patientId, userId),
          eq(consultations.doctorId, userId),
        ),
      ),
    );

  return upcoming;
}
