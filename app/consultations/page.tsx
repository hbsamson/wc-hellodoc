import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getPatientConsultations, getDoctorConsultations } from '@/app/actions/consultations'
import { getUserRole } from '@/app/actions/helpers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Calendar, Clock } from 'lucide-react'

export default async function ConsultationsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    redirect('/sign-in')
  }

  const userRole = await getUserRole()
  const isDoctor = userRole === 'doctor'

  const consultations = isDoctor
    ? await getDoctorConsultations()
    : await getPatientConsultations()

  const categorizedConsultations = {
    scheduled: consultations.filter((c) => c.status === 'scheduled'),
    inProgress: consultations.filter((c) => c.status === 'in-progress'),
    completed: consultations.filter((c) => c.status === 'completed'),
    cancelled: consultations.filter((c) => c.status === 'cancelled'),
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-700'
      case 'in-progress':
        return 'bg-green-100 text-green-700'
      case 'completed':
        return 'bg-gray-100 text-gray-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="min-h-screen">
      {/* Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Consultations</h1>
          <p className="text-muted-foreground">
            {isDoctor ? 'Manage your consultations with patients' : 'View and manage your consultations'}
          </p>
        </div>

        {/* Scheduled Consultations */}
        {categorizedConsultations.scheduled.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Scheduled</h2>
            <div className="grid gap-4">
              {categorizedConsultations.scheduled.map((consultation) => (
                <Card key={consultation.id} className="hover:border-primary transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {new Date(consultation.scheduledAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {new Date(consultation.scheduledAt).toLocaleTimeString()}
                        </div>
                        <span
                          className={`inline-block px-3 py-1 rounded text-xs font-medium ${getStatusBadgeColor(
                            consultation.status,
                          )}`}
                        >
                          {consultation.status}
                        </span>
                      </div>
                      <Link href={`/consultations/${consultation.id}`}>
                        <Button>
                          {consultation.status === 'in-progress' ? 'Join Call' : 'View'}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* In Progress Consultations */}
        {categorizedConsultations.inProgress.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">In Progress</h2>
            <div className="grid gap-4">
              {categorizedConsultations.inProgress.map((consultation) => (
                <Card key={consultation.id} className="border-green-200 bg-green-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                          <span className="font-semibold text-green-700">Active Call</span>
                        </div>
                        <span
                          className={`inline-block px-3 py-1 rounded text-xs font-medium ${getStatusBadgeColor(
                            consultation.status,
                          )}`}
                        >
                          {consultation.status}
                        </span>
                      </div>
                      <Link href={`/consultations/${consultation.id}`}>
                        <Button>Join Call</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Completed Consultations */}
        {categorizedConsultations.completed.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Completed</h2>
            <div className="grid gap-4">
              {categorizedConsultations.completed.map((consultation) => (
                <Card key={consultation.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">
                          Completed on{' '}
                          {new Date(consultation.endedAt || consultation.scheduledAt).toLocaleDateString()}
                        </p>
                        {consultation.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{consultation.notes}</p>
                        )}
                      </div>
                      <Link href={`/consultations/${consultation.id}`}>
                        <Button variant="outline">View Details</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No Consultations */}
        {Object.values(categorizedConsultations).every((arr) => arr.length === 0) && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No consultations yet</p>
              {!isDoctor && (
                <Link href="/doctors">
                  <Button>Browse Doctors</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
