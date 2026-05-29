import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getAllDoctors } from '@/app/actions/doctors'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Star } from 'lucide-react'

export default async function DoctorsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    redirect('/sign-in')
  }

  const doctors = await getAllDoctors()

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
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link href="/consultations">
              <Button variant="ghost">Consultations</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Browse Doctors</h1>
          <p className="text-muted-foreground">
            Find and book consultations with our verified healthcare professionals
          </p>
        </div>

        {doctors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No doctors available at the moment.</p>
            <Link href="/dashboard">
              <Button>Return to Dashboard</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor) => (
              <Card key={doctor.id} className="flex flex-col hover:border-primary transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <CardTitle>{doctor.specialty}</CardTitle>
                      <CardDescription>
                        {doctor.experienceYears || 0} years experience
                      </CardDescription>
                    </div>
                    {doctor.isAvailable && (
                      <div className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        Available
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  {doctor.bio && (
                    <p className="text-sm text-muted-foreground mb-4">{doctor.bio}</p>
                  )}
                  {doctor.hourlyRate && (
                    <p className="text-lg font-semibold text-primary mb-4">
                      ${doctor.hourlyRate}/hour
                    </p>
                  )}
                  <div className="flex gap-2 mt-auto">
                    <Link href={`/doctors/${doctor.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        View Profile
                      </Button>
                    </Link>
                    <Link href={`/book/${doctor.id}`} className="flex-1">
                      <Button className="w-full">Book Now</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
