import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getDoctorById, getDoctorReviews } from '@/app/actions/doctors'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, DollarSign, Star } from 'lucide-react'

interface DoctorProfilePageProps {
  params: Promise<{
    doctorId: string
  }>
}

export default async function DoctorProfilePage({
  params,
}: DoctorProfilePageProps) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    redirect('/sign-in')
  }

  const { doctorId } = await params
  const doctor = await getDoctorById(doctorId)
  if (!doctor) {
    notFound()
  }

  const reviews = await getDoctorReviews(doctor.id)
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : null

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Link href="/doctors">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Doctor Profile</h1>
        </div>
      </nav>

      <main className="container mx-auto max-w-4xl px-4 py-12">
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-3xl">
                    {doctor.name || 'Doctor'}
                  </CardTitle>
                  <CardDescription className="mt-2 text-base">
                    {doctor.specialty}
                  </CardDescription>
                </div>
                {doctor.isAvailable && <Badge>Available</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {doctor.bio && (
                <section>
                  <h2 className="mb-2 text-lg font-semibold">About</h2>
                  <p className="text-muted-foreground">{doctor.bio}</p>
                </section>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg border p-4">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Experience</p>
                    <p className="font-semibold">
                      {doctor.experienceYears || 0} years
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border p-4">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Rate</p>
                    <p className="font-semibold">
                      {doctor.hourlyRate ? `$${doctor.hourlyRate}/hour` : 'Not set'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border p-4">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Availability</p>
                    <p className="font-semibold">
                      {doctor.availableFrom && doctor.availableUntil
                        ? `${doctor.availableFrom} - ${doctor.availableUntil}`
                        : 'Flexible'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border p-4">
                  <Star className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Rating</p>
                    <p className="font-semibold">
                      {averageRating ? averageRating.toFixed(1) : 'No reviews yet'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Book a Consultation</CardTitle>
              <CardDescription>
                Schedule a video consultation with this doctor.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/book/${doctor.id}`}>
                <Button className="w-full">Book Now</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <section className="mt-8">
          <h2 className="mb-4 text-2xl font-bold">Reviews</h2>
          {reviews.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No reviews yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="space-y-2 pt-6">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      <span className="font-semibold">{review.rating}/5</span>
                    </div>
                    {review.comment && (
                      <p className="text-muted-foreground">{review.comment}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
