import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  createDoctorProfile,
  getDoctorProfile,
  saveDoctorLicenseId,
  saveDoctorProfileImage,
  updateDoctorProfile,
} from "@/app/actions/doctors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CONSULTATION_BLOCK_MINUTES,
  parseTimeToMinutes,
} from "@/lib/consultation-scheduling";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AvailabilityToggle } from "@/components/availability-toggle";
import { TimePicker } from "@/components/time-picker";
import Link from "next/link";
import { ArrowLeft, Camera, UserRound, Clock } from "lucide-react";

const SPECIALIZATION_GROUPS = [
  {
    general: "Primary Care",
    subspecializations: [
      "General Medicine",
      "Family Medicine",
      "Internal Medicine",
    ],
  },
  {
    general: "Pediatrics",
    subspecializations: ["General Pediatrics", "Neonatology"],
  },
  {
    general: "Women's Health",
    subspecializations: ["Obstetrics and Gynecology", "Reproductive Health"],
  },
  {
    general: "Mental Health",
    subspecializations: ["Psychiatry", "Clinical Psychology"],
  },
  {
    general: "Medical Specialties",
    subspecializations: [
      "Cardiology",
      "Dermatology",
      "Endocrinology",
      "Gastroenterology",
      "Neurology",
      "Pulmonology",
    ],
  },
  {
    general: "Surgical Specialties",
    subspecializations: ["General Surgery", "Orthopedics", "Ophthalmology"],
  },
];

const SPECIALIZATION_OPTIONS = SPECIALIZATION_GROUPS.flatMap((group) =>
  group.subspecializations.map(
    (subspecialization) => `${group.general} - ${subspecialization}`,
  ),
);

function optionalNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }
  return Number(value);
}

function optionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }
  return value;
}

function splitName(name?: string | null) {
  if (!name) {
    return { givenName: "", lastName: "" };
  }
  const parts = name.trim().split(/\s+/);
  return {
    givenName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
}

export default async function DoctorProfileEditorPage({
  searchParams,
}: {
  searchParams: Promise<{ onboarding?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/sign-in");
  }

  const [{ onboarding }, profile] = await Promise.all([
    searchParams,
    getDoctorProfile(session.user.id),
  ]);
  const isOnboarding = onboarding === "1";
  const profileName =
    profile?.givenName || profile?.lastName
      ? {
          givenName: profile.givenName || "",
          lastName: profile.lastName || "",
        }
      : splitName(profile?.name || session.user.name);

  async function saveDoctorProfile(formData: FormData) {
    "use server";
    const givenName = optionalString(formData.get("givenName"));
    const lastName = optionalString(formData.get("lastName"));
    const name = [givenName, lastName]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(" ");

    // Handle profile image upload
    const imageFile = formData.get("image");
    const existingImage = optionalString(formData.get("existingImage"));
    let image: string | undefined;
    if (imageFile instanceof File && imageFile.size > 0) {
      image = await saveDoctorProfileImage(imageFile);
    } else {
      image = existingImage;
    }

    const data = {
      name,
      givenName,
      lastName,
      image,
      specialty: String(formData.get("specialty") || ""),
      bio: optionalString(formData.get("bio")),
      licenseNumber: optionalString(formData.get("licenseNumber")),
      experienceYears: optionalNumber(formData.get("experienceYears")),
      hourlyRate: optionalString(formData.get("hourlyRate")),
      isAvailable: isOnboarding ? true : formData.get("isAvailable") === "on",
      availableFrom: optionalString(formData.get("availableFrom")),
      availableUntil: optionalString(formData.get("availableUntil")),
    };

    if (!data.name) {
      throw new Error("Full name is required");
    }

    if (!data.specialty) {
      throw new Error("Specialization is required");
    }

    if (isOnboarding && data.experienceYears === undefined) {
      throw new Error("Years of experience is required");
    }

    if (
      data.experienceYears !== undefined &&
      (!Number.isFinite(data.experienceYears) || data.experienceYears < 0)
    ) {
      throw new Error("Years of experience must be zero or greater");
    }

    if (isOnboarding && !data.hourlyRate) {
      throw new Error("Rate per session is required");
    }

    const availableFromMinutes = parseTimeToMinutes(data.availableFrom);
    const availableUntilMinutes = parseTimeToMinutes(data.availableUntil);

    if (
      (data.availableFrom && availableFromMinutes === null) ||
      (data.availableUntil && availableUntilMinutes === null)
    ) {
      throw new Error("Availability times are invalid");
    }

    if (
      (availableFromMinutes === null && availableUntilMinutes !== null) ||
      (availableFromMinutes !== null && availableUntilMinutes === null)
    ) {
      throw new Error("Set both availability start and end times");
    }

    if (
      availableFromMinutes !== null &&
      availableUntilMinutes !== null &&
      availableUntilMinutes - availableFromMinutes < CONSULTATION_BLOCK_MINUTES
    ) {
      throw new Error("Availability must include at least one 30-minute block");
    }

    // Upload license file to Cloudinary if provided
    const licenseFile = formData.get("licenseId");
    if (licenseFile instanceof File && licenseFile.size > 0) {
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp",
      ];
      if (!allowedTypes.includes(licenseFile.type)) {
        throw new Error("License ID must be a PDF, JPG, PNG, or WebP file");
      }
      const maxSize = 5 * 1024 * 1024;
      if (licenseFile.size > maxSize) {
        throw new Error("License ID must be 5MB or smaller");
      }
      await saveDoctorLicenseId(licenseFile);
    }

    const userId = await auth.api
      .getSession({ headers: await headers() })
      .then((currentSession) => currentSession?.user.id);

    if (!userId) {
      redirect("/sign-in");
    }

    const existingProfile = await getDoctorProfile(userId);
    if (existingProfile) {
      await updateDoctorProfile(data);
    } else {
      await createDoctorProfile(data);
    }

    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen">
      <main className="container mx-auto max-w-5xl pt-12 flex">
        <Card>
          <CardHeader>
            <CardTitle>
              {isOnboarding
                ? "Complete Your Doctor Profile"
                : profile
                  ? "Edit Doctor Profile"
                  : "Create Doctor Profile"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={saveDoctorProfile} className="space-y-8">
              {/* Two-column layout */}
              <div className="grid gap-8 lg:grid-cols-2">
                {/* ===== LEFT COLUMN — Personal Information ===== */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <UserRound className="h-4 w-4 text-primary" />
                    Personal Information
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="givenName">
                        Given Name <span className="text-primary">*</span>
                      </Label>
                      <Input
                        id="givenName"
                        name="givenName"
                        defaultValue={profileName.givenName}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">
                        Last Name <span className="text-primary">*</span>
                      </Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        defaultValue={profileName.lastName}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specialty">
                      Specialization <span className="text-primary">*</span>
                    </Label>
                    <select
                      id="specialty"
                      name="specialty"
                      defaultValue={profile?.specialty || ""}
                      className="border-gray-200 dark:border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    >
                      <option value="" disabled>
                        Select general category - subspecialization
                      </option>
                      {profile?.specialty &&
                        !SPECIALIZATION_OPTIONS.includes(profile.specialty) && (
                          <option value={profile.specialty}>
                            {profile.specialty}
                          </option>
                        )}
                      {SPECIALIZATION_GROUPS.map((group) => (
                        <optgroup key={group.general} label={group.general}>
                          {group.subspecializations.map((subspecialization) => {
                            const value = `${group.general} - ${subspecialization}`;
                            return (
                              <option key={value} value={value}>
                                {subspecialization}
                              </option>
                            );
                          })}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">
                      Bio <span className="text-primary">*</span>
                    </Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      defaultValue={profile?.bio || ""}
                      rows={5}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="licenseNumber">
                        License Number <span className="text-primary">*</span>
                      </Label>
                      <Input
                        id="licenseNumber"
                        name="licenseNumber"
                        defaultValue={profile?.licenseNumber || ""}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="experienceYears">
                        Years of Experience
                      </Label>
                      <Input
                        id="experienceYears"
                        name="experienceYears"
                        type="number"
                        min="0"
                        defaultValue={profile?.experienceYears || ""}
                        required={isOnboarding}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="licenseId">
                      License ID Upload <span className="text-primary">*</span>
                    </Label>
                    <Input
                      id="licenseId"
                      name="licenseId"
                      type="file"
                      accept="application/pdf,image/jpeg,image/png,image/webp"
                      required={isOnboarding}
                    />
                    <p className="text-xs text-muted-foreground">
                      Upload a PDF, JPG, PNG, or WebP file up to 5MB.
                    </p>
                  </div>

                  {/* Profile Picture */}
                  <div className="space-y-3">
                    <Label htmlFor="image" className="flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      Profile Picture
                    </Label>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted">
                        {profile?.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={profile.image}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <UserRound className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <Input
                          id="image"
                          name="image"
                          type="file"
                          accept="image/*"
                        />
                        <input
                          type="hidden"
                          name="existingImage"
                          value={profile?.image || ""}
                        />
                        <p className="text-xs text-muted-foreground">
                          Upload a JPG, PNG, or WebP image up to 5MB.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* ===== RIGHT COLUMN — Consultation Details ===== */}
                <section className="space-y-4">
                  {/* Compensation */}
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <span className="text-lg leading-none">₱</span>
                    Compensation
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate">Rate per Session (₱)</Label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
                        ₱
                      </span>
                      <Input
                        id="hourlyRate"
                        name="hourlyRate"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={profile?.hourlyRate || ""}
                        required={isOnboarding}
                        className="pl-7"
                      />
                    </div>
                  </div>

                  {/* Schedule / Availability */}
                  <div className="pt-4 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Clock className="h-4 w-4 text-primary" />
                      Schedule Availability
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Set the hours you are available for consultations. Times
                      are in 30-minute blocks.
                    </p>

                    <div className="space-y-2">
                      <Label>Available From</Label>
                      <TimePicker
                        name="availableFrom"
                        defaultValue={profile?.availableFrom?.slice(0, 5) || ""}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Available Until</Label>
                      <TimePicker
                        name="availableUntil"
                        defaultValue={
                          profile?.availableUntil?.slice(0, 5) || ""
                        }
                      />
                    </div>
                    {!isOnboarding && (
                      <AvailabilityToggle
                        name="isAvailable"
                        defaultChecked={profile?.isAvailable ?? true}
                      />
                    )}
                  </div>
                  <Button type="submit" className="w-full">
                    {isOnboarding ? "Complete Onboarding" : "Save Profile"}
                  </Button>
                </section>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
