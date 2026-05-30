import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import {
  Bot,
  CalendarDays,
  Bell,
  FileText,
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Search,
  Stethoscope,
  UserRound,
  VideoIcon,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type DashboardNavProps = {
  userType: "patient" | "doctor";
  toggleId: string;
};

type AuthTopBarProps = {
  userName: string;
  userEmail: string;
  userType: "patient" | "doctor";
  image?: string | null;
};

export function AuthTopBar({
  userName,
  userEmail,
  userType,
  image,
}: AuthTopBarProps) {
  const profileHref =
    userType === "doctor" ? "/doctor-profile" : "/patient-profile";
  const userLabel = userName || userEmail;
  const initials = userLabel
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-16 items-center justify-between gap-4 px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src="/hellodoc-logo.png"
            alt="HelloDoc"
            width={36}
            height={36}
            className="h-9 w-9 rounded-lg bg-white object-contain p-1"
            priority
          />
          <span className="text-xl font-bold text-primary">HelloDoc</span>
        </Link>

        <div className="flex items-center justify-end gap-2">
          <ThemeToggle />

          <Link
            href={profileHref}
            className="border flex items-center gap-3 rounded-md px-2 py-1 transition-colors hover:bg-gray-300"
          >
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src={image ?? undefined} alt={userLabel} />
              <AvatarFallback>
                {userLabel
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="text-right">
              <p className="max-w-36 truncate text-sm font-medium leading-tight sm:max-w-48">
                {userLabel}
              </p>
              <p className="text-xs capitalize leading-tight text-muted-foreground">
                {userType}
              </p>
            </div>
          </Link>

          <form
            action={async () => {
              "use server";
              await auth.api.signOut({ headers: await headers() });
              redirect("/");
            }}
          >
            <Button variant="outline" type="submit" size="sm" className="gap-2">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Log Out</span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}

export function DashboardNav({ userType, toggleId }: DashboardNavProps) {
  const navItems =
    userType === "doctor"
      ? [
          { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
          { label: "Schedule", href: "/consultations", icon: CalendarDays },
          { label: "Consultation", href: "/consultations", icon: VideoIcon },
          {
            label: "Medical Records",
            href: "/medical-records",
            icon: Stethoscope,
          },
          { label: "Notifications", href: "/notifications", icon: Bell },
          { label: "Profile", href: "/doctor-profile", icon: UserRound },
        ]
      : [
          { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
          { label: "Find Doctors", href: "/doctors", icon: Search },
          // { label: "AI Recommendation", href: "/doctors", icon: Bot },
          { label: "Consultations", href: "/consultations", icon: VideoIcon },
          {
            label: "Medical Records",
            href: "/patient-medical-history",
            icon: FileText,
          },
          { label: "Notifications", href: "/notifications", icon: Bell },
          { label: "Profile", href: "/patient-profile", icon: UserRound },
        ];

  return (
    <aside className="app-sidebar fixed inset-x-0 top-16 z-40 border-b bg-background/95 backdrop-blur transition-all duration-200 lg:inset-x-auto lg:bottom-0 lg:left-0 lg:w-16 lg:border-b-0 lg:border-r">
      <div className="flex min-h-14 items-center gap-2 overflow-x-auto px-3 py-2 lg:h-full lg:flex-col lg:items-stretch lg:justify-start lg:overflow-hidden lg:p-3">
        <nav className="flex w-full gap-2 lg:flex-col">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                className="shrink-0"
                title={item.label}
              >
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 lg:h-10 lg:px-3"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="sidebar-label whitespace-nowrap transition-all duration-200">
                    {item.label}
                  </span>
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto lg:mt-auto lg:ml-0">
          <label
            htmlFor={toggleId}
            title="Toggle sidebar"
            className="flex h-10 cursor-pointer items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent"
          >
            <PanelLeft className="h-4 w-4 shrink-0" />
            <span className="sidebar-label hidden whitespace-nowrap transition-all duration-200 lg:inline">
              Collapse menu
            </span>
            <span className="sidebar-collapsed-label hidden whitespace-nowrap lg:inline">
              Expand menu
            </span>
          </label>
        </div>
      </div>
    </aside>
  );
}

export function PublicNav() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/hellodoc.png"
            alt="HelloDoc"
            width={36}
            height={36}
            className="h-9 w-9 rounded-lg bg-foreground object-contain p-1"
            priority
          />
          <span className="text-xl font-bold text-primary">HelloDoc</span>
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link href="/sign-in">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm">Sign Up</Button>
          </Link>
          <Link href="/sign-up?userType=doctor" className="hidden sm:block">
            <Button variant="outline" size="sm">
              Sign Up as Doctor
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
