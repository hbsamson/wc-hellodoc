"use server";

import { db } from "@/lib/db";
import {
  patientMedicalFiles,
  consultations,
  prescriptions,
  user,
} from "@/lib/db/schema";
import { cloudinary } from "@/lib/cloudinary";
import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getUserId } from "./helpers";

async function uploadMedicalFileToCloudinary(file: File) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const result = await new Promise<{
    secure_url: string;
    public_id: string;
  }>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "patient-medical-files",
          resource_type: "auto",
        },
        (error, result) => {
          if (error || !result) {
            reject(error);
            return;
          }

          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        },
      )
      .end(buffer);
  });

  return result;
}

export async function savePatientMedicalFile(file: File, description?: string) {
  const userId = await getUserId();
  const uploaded = await uploadMedicalFileToCloudinary(file);

  await db.insert(patientMedicalFiles).values({
    id: nanoid(),
    userId,
    url: uploaded.secure_url,
    publicId: uploaded.public_id,
    filename: file.name,
    mimeType: file.type,
    size: file.size,
    description,
  });
}

export async function getPatientMedicalFiles() {
  const userId = await getUserId();

  return db
    .select()
    .from(patientMedicalFiles)
    .where(eq(patientMedicalFiles.userId, userId))
    .orderBy(desc(patientMedicalFiles.createdAt));
}

export async function getPatientConsultationHistory() {
  const userId = await getUserId();

  const consultationHistory = await db
    .select({
      id: consultations.id,
      status: consultations.status,
      scheduledAt: consultations.scheduledAt,
      startedAt: consultations.startedAt,
      endedAt: consultations.endedAt,
      notes: consultations.notes,
      doctorId: consultations.doctorId,
      doctorName: user.name,
      specialty: user.specialty,
    })
    .from(consultations)
    .innerJoin(user, eq(consultations.doctorId, user.id))
    .where(eq(consultations.patientId, userId))
    .orderBy(desc(consultations.scheduledAt));

  return consultationHistory;
}

export async function getPatientPrescriptions() {
  const userId = await getUserId();

  const patientPrescriptions = await db
    .select({
      id: prescriptions.id,
      medications: prescriptions.medications,
      instructions: prescriptions.instructions,
      createdAt: prescriptions.createdAt,
      consultationId: prescriptions.consultationId,
      doctorName: user.name,
      doctorSpecialty: user.specialty,
      consultationDate: consultations.scheduledAt,
    })
    .from(prescriptions)
    .innerJoin(user, eq(prescriptions.doctorId, user.id))
    .innerJoin(
      consultations,
      eq(prescriptions.consultationId, consultations.id),
    )
    .where(eq(prescriptions.patientId, userId))
    .orderBy(desc(prescriptions.createdAt));

  return patientPrescriptions;
}
