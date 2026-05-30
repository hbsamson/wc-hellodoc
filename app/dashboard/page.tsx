import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getPatientConsultations, getDoctorConsultations } from '@/app/actions/consultations'
import { getUserRole } from '@/app/actions/helpers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Calendar, UserRound, Users, VideoIcon } from 'lucide-react'

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    redirect('/sign-in')
  }

  const userRole = await getUserRole()
  const isDoctor = userRole === 'doctor'

  let consultations = []
  if (isDoctor) {
    consultations = await getDoctorConsultations()
  } else {
    consultations = await getPatientConsultations()
  }

  const upcomingConsultations = consultations.filter(
    (c) => c.status === 'scheduled' && new Date(c.scheduledAt) > new Date(),
  )
  const pastConsultations = consultations.filter((c) => c.status === 'completed')

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold">H</span>
            </div>
            <span className="text-xl font-bold text-primary">HelloDoc</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/doctors">
              <Button variant="ghost">Browse Doctors</Button>
            </Link>
            <Link href="/consultations">
              <Button variant="ghost">Consultations</Button>
            </Link>
            {!isDoctor && (
              <Link href="/patient-profile">
                <Button variant="ghost">Patient Profile</Button>
              </Link>
            )}
            <form
              action={async () => {
                'use server'
                await auth.api.signOut({ headers: await headers() })
                redirect('/')
              }}
            >
              <Button variant="outline" type="submit">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">
            Welcome, {session.user.name || session.user.email}
          </h1>
          <p className="text-muted-foreground">
            {isDoctor
              ? 'Manage your consultations and patient interactions'
              : 'Book consultations and manage your healthcare'}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Upcoming
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{upcomingConsultations.length}</p>
              <p className="text-sm text-muted-foreground">Scheduled consultations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <VideoIcon className="w-5 h-5 text-accent" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{pastConsultations.length}</p>
              <p className="text-sm text-muted-foreground">Finished consultations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isDoctor ? (
                <p className="text-sm text-muted-foreground mb-3">Manage your profile</p>
              ) : (
                <p className="text-sm text-muted-foreground mb-3">Find doctors and book</p>
              )}
              <Link href={isDoctor ? '/doctor-profile' : '/doctors'}>
                <Button size="sm">
                  {isDoctor ? 'Edit Profile' : 'Browse Doctors'}
                </Button>
              </Link>
            </CardContent>
          </Card>

          {!isDoctor && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <UserRound className="w-5 h-5 text-accent" />
                  Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Keep your patient details ready for visits
                </p>
                <Link href="/patient-profile">
                  <Button size="sm" variant="outline">
                    Edit Patient Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Upcoming Consultations */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Upcoming Consultations</h2>
          {upcomingConsultations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">No upcoming consultations</p>
                <Link href="/doctors">
                  <Button>Browse Doctors</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcomingConsultations.map((consultation) => (
                <Card key={consultation.id}>
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">
                        Consultation scheduled for{' '}
                        {new Date(consultation.scheduledAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(consultation.scheduledAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <Link href={`/consultations/${consultation.id}`}>
                      <Button>View Details</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Past Consultations */}
        {pastConsultations.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Past Consultations</h2>
            <div className="space-y-4">
              {pastConsultations.slice(0, 5).map((consultation) => (
                <Card key={consultation.id}>
                  <CardContent className="pt-6">
                    <p className="font-semibold">
                      Completed on{' '}
                      {new Date(consultation.endedAt || consultation.scheduledAt).toLocaleDateString()}
                    </p>
                    {consultation.notes && (
                      <p className="text-sm text-muted-foreground mt-2">{consultation.notes}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
