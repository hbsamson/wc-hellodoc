"use server";

import { db } from "@/lib/db";
import { patientMedicalFiles } from "@/lib/db/schema";
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
