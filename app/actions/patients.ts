"use server";

import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getUserId } from "./helpers";

export type PatientProfileData = {
  name: string;
  givenName: string;
  lastName: string;
  birthday?: string;
  weightKg?: string;
  heightCm?: string;
  image?: string;
  phoneNumber?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalHistory?: string;
};

export async function getPatientProfile(userId: string) {
  const profile = await db
    .select()
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return profile[0] || null;
}

export async function updatePatientProfile(data: PatientProfileData) {
  const userId = await getUserId();

  const updated = await db
    .update(user)
    .set({
      name: data.name,
      givenName: data.givenName,
      lastName: data.lastName,
      userType: "patient",
      birthday: data.birthday,
      weightKg: data.weightKg,
      heightCm: data.heightCm,
      image: data.image,
      phoneNumber: data.phoneNumber,
      address: data.address,
      emergencyContactName: data.emergencyContactName,
      emergencyContactPhone: data.emergencyContactPhone,
      medicalHistory: data.medicalHistory,
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId))
    .returning();

  revalidatePath("/dashboard");
  revalidatePath("/patient-profile");

  return updated[0] || null;
}

import { cloudinary } from "@/lib/cloudinary";

export async function savePatientProfileImage(file: File) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const result = await new Promise<{ secure_url: string }>(
    (resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "patient-profile-images",
            resource_type: "image",
          },
          (error, result) => {
            if (error || !result) reject(error);
            else resolve(result as { secure_url: string });
          },
        )
        .end(buffer);
    },
  );

  return result.secure_url;
}

export async function isPatientProfileComplete(profile: {
  name: string | null;
  birthday: string | null;
  weightKg: string | null;
  heightCm: string | null;
  phoneNumber: string | null;
  medicalHistory: string | null;
}) {
  return Boolean(
    profile.name &&
    profile.birthday &&
    profile.weightKg &&
    profile.heightCm &&
    profile.phoneNumber &&
    profile.medicalHistory,
  );
}
