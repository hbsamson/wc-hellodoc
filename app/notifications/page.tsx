import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  getDoctorConsultations,
  getPatientConsultations,
} from "@/app/actions/consultations";
import { getUserRole } from "@/app/actions/helpers";
import { markNotificationsRead } from "@/app/actions/notifications";
import {
  AppointmentNotification,
  NotificationsFeed,
} from "./notifications-feed";

type Consultation =
  | Awaited<ReturnType<typeof getPatientConsultations>>[number]
  | Awaited<ReturnType<typeof getDoctorConsultations>>[number];

export default async function NotificationsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/sign-in");
  }

  // Mark all notifications as read when the page is opened
  await markNotificationsRead();

  const userRole = await getUserRole();
  const isDoctor = userRole === "doctor";
  const consultations = isDoctor
    ? await getDoctorConsultations()
    : await getPatientConsultations();

  return (
    <main className="container mx-auto px-6 py-10 sm:px-8 lg:px-10">
      <NotificationsFeed
        notifications={buildAppointmentNotifications(consultations, isDoctor)}
      />
    </main>
  );
}

function buildAppointmentNotifications(
  consultations: Consultation[],
  isDoctor: boolean,
): AppointmentNotification[] {
  const now = new Date();
  const nextDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return consultations
    .flatMap((consultation) => {
      const scheduledAt = new Date(consultation.scheduledAt);
      const otherPersonName =
        isDoctor && "patientName" in consultation
          ? consultation.patientName || "Patient"
          : !isDoctor && "doctorName" in consultation
            ? consultation.doctorName || "Doctor"
            : isDoctor
              ? "Patient"
              : "Doctor";

      const subject = isDoctor
        ? `patient appointment with ${otherPersonName}`
        : `doctor appointment with Dr. ${otherPersonName}`;

      const notifications: AppointmentNotification[] = [
        {
          id: `${consultation.id}:booked`,
          title: "Appointment booked",
          body: `Your ${subject} is scheduled for ${formatDateTime(scheduledAt)}.`,
          time: formatRelativeTime(consultation.createdAt),
          href: `/consultations/${consultation.id}`,
          priority: "normal",
        },
      ];

      if (consultation.status === "scheduled" && scheduledAt >= now) {
        notifications.push({
          id: `${consultation.id}:upcoming`,
          title:
            scheduledAt <= nextDay
              ? "Upcoming appointment"
              : "Scheduled appointment",
          body: `Starts ${formatDateTime(scheduledAt)}.`,
          time: formatRelativeTime(scheduledAt),
          href: `/consultations/${consultation.id}`,
          priority: scheduledAt <= nextDay ? "high" : "normal",
        });
      }

      if (consultation.status === "in-progress") {
        notifications.push({
          id: `${consultation.id}:live`,
          title: "Consultation is live",
          body: "The appointment room is open now.",
          time: "Now",
          href: `/consultations/${consultation.id}`,
          priority: "high",
        });
      }

      if (consultation.status === "cancelled") {
        notifications.push({
          id: `${consultation.id}:cancelled`,
          title: "Appointment cancelled",
          body: `The appointment for ${formatDateTime(scheduledAt)} was cancelled.`,
          time: formatRelativeTime(consultation.updatedAt),
          href: `/consultations/${consultation.id}`,
          priority: "high",
        });
      }

      if (consultation.status === "completed") {
        notifications.push({
          id: `${consultation.id}:completed`,
          title: "Consultation completed",
          body: "Visit notes and prescriptions are available when provided.",
          time: formatRelativeTime(
            consultation.endedAt || consultation.updatedAt,
          ),
          href: `/consultations/${consultation.id}`,
          priority: "normal",
        });
      }

      if (
        consultation.status === "scheduled" &&
        consultation.updatedAt &&
        new Date(consultation.updatedAt).getTime() >
          new Date(consultation.createdAt).getTime() + 1000
      ) {
        notifications.push({
          id: `${consultation.id}:updated`,
          title: "Schedule updated",
          body: `The appointment is now set for ${formatDateTime(scheduledAt)}.`,
          time: formatRelativeTime(consultation.updatedAt),
          href: `/consultations/${consultation.id}`,
          priority: "high",
        });
      }

      return notifications;
    })
    .sort((a, b) => getNotificationTime(b) - getNotificationTime(a));
}

function getNotificationTime(notification: AppointmentNotification) {
  if (notification.time === "Now") {
    return Date.now();
  }

  return Date.parse(notification.time) || 0;
}

function formatDateTime(value: Date) {
  return `${value.toLocaleDateString()} at ${value.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

function formatRelativeTime(value: string | Date | null) {
  if (!value) {
    return "Now";
  }

  return new Date(value).toLocaleString();
}
