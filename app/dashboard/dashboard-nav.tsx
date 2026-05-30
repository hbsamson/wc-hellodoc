import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import {
  Bot,
  CalendarDays,
  FileText,
  LayoutDashboard,
  LogOut,
  Search,
  Stethoscope,
  UserRound,
  VideoIcon,
} from 'lucide-react'
import { auth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './theme-toggle'

type DashboardNavProps = {
  userName: string
  userEmail: string
  userType: 'patient' | 'doctor'
}

export function DashboardNav({ userName, userEmail, userType }: DashboardNavProps) {
  const profileHref = userType === 'doctor' ? '/doctor-profile' : '/patient-profile'
  const userLabel = userName || userEmail
  const navItems =
    userType === 'doctor'
      ? [
          { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
          { label: 'Schedule', href: '/consultations', icon: CalendarDays },
          { label: 'Consultation', href: '/consultations', icon: VideoIcon },
          { label: 'Notes', href: '/consultations', icon: Stethoscope },
          { label: 'Profile', href: '/doctor-profile', icon: UserRound },
        ]
      : [
          { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
          { label: 'Find Doctors', href: '/doctors', icon: Search },
          { label: 'AI Recommendation', href: '/doctors', icon: Bot },
          { label: 'Consultations', href: '/consultations', icon: VideoIcon },
          { label: 'Medical Records', href: '/patient-medical-history', icon: FileText },
        ]

  return (
    <aside className="group/sidebar z-50 border-b bg-background/95 backdrop-blur transition-all duration-200 lg:fixed lg:inset-y-0 lg:left-0 lg:w-20 lg:border-b-0 lg:border-r lg:hover:w-72 lg:focus-within:w-72">
      <div className="flex min-h-16 flex-wrap items-center justify-between gap-4 px-4 py-3 lg:h-full lg:flex-col lg:items-stretch lg:justify-start lg:overflow-hidden lg:p-4">
        <Link href="/dashboard" className="flex items-center gap-2 lg:mb-6 lg:h-10 lg:justify-start">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary">
            <span className="font-bold text-primary-foreground">H</span>
          </div>
          <span className="text-2xl font-bold text-primary transition-opacity lg:opacity-0 lg:group-hover/sidebar:opacity-100 lg:group-focus-within/sidebar:opacity-100">
            HelloDoc
          </span>
        </Link>

        <nav className="order-3 flex w-full gap-2 overflow-x-auto lg:order-none lg:flex-col lg:overflow-visible">
          {navItems.map((item) => {
            const Icon = item.icon

            return (
              <Link key={item.label} href={item.href} className="shrink-0" title={item.label}>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 lg:h-11 lg:px-3"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap transition-opacity lg:opacity-0 lg:group-hover/sidebar:opacity-100 lg:group-focus-within/sidebar:opacity-100">
                    {item.label}
                  </span>
                </Button>
              </Link>
            )
          })}
        </nav>

        <div className="flex flex-wrap items-center justify-end gap-2 lg:mt-auto lg:flex-col lg:items-stretch">
          <Link
            href={profileHref}
            className="flex min-h-11 items-center gap-2 rounded-md border px-3 py-2 text-right transition-colors hover:bg-accent lg:text-left"
          >
            <UserRound className="hidden h-4 w-4 shrink-0 lg:block" />
            <span className="transition-opacity lg:opacity-0 lg:group-hover/sidebar:opacity-100 lg:group-focus-within/sidebar:opacity-100">
              <p className="max-w-40 truncate text-sm font-medium leading-tight">{userLabel}</p>
              <p className="text-xs capitalize leading-tight text-muted-foreground">{userType}</p>
            </span>
          </Link>
          <div className="flex gap-2 lg:grid lg:grid-cols-[auto_1fr] lg:items-center">
            <ThemeToggle />
            <span className="hidden text-sm text-muted-foreground transition-opacity lg:block lg:opacity-0 lg:group-hover/sidebar:opacity-100 lg:group-focus-within/sidebar:opacity-100">
              Theme
            </span>
          </div>
          <form
            action={async () => {
              'use server'
              await auth.api.signOut({ headers: await headers() })
              redirect('/')
            }}
          >
            <Button variant="outline" type="submit" size="sm" className="w-full justify-start gap-2">
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="transition-opacity lg:opacity-0 lg:group-hover/sidebar:opacity-100 lg:group-focus-within/sidebar:opacity-100">
                Sign Out
              </span>
            </Button>
          </form>
        </div>
      </div>
    </aside>
  )
}

export function PublicNav() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="font-bold text-primary-foreground">H</span>
          </div>
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
  )
}
