'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Star, Calendar, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { getRecommendedDoctorsForChat } from '@/app/actions/ai-recommendation'

interface RecommendationResultsProps {
  chatId: string
  specialties: string[]
}

interface RecommendedDoctor {
  id: string
  rank: number
  matchReason: string | null
  doctor: {
    id: string
    name: string | null
    specialty: string | null
    experienceYears: number | null
    hourlyRate: string | null
    image: string | null
  } | undefined
}

export function RecommendationResults({ chatId, specialties }: RecommendationResultsProps) {
  const [doctors, setDoctors] = useState<RecommendedDoctor[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const result = await getRecommendedDoctorsForChat(chatId)
        setDoctors(result as RecommendedDoctor[])
      } catch (error) {
        console.error('Failed to fetch recommended doctors:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDoctors()
  }, [chatId])

  if (isLoading) {
    return <div className="text-center py-8">Loading recommendations...</div>
  }

  if (doctors.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No doctors found for the recommended specialties.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm font-medium text-blue-900">
          Recommended specialties: <span className="font-semibold">{specialties.join(', ')}</span>
        </p>
      </div>

      <div className="grid gap-4">
        {doctors.map((rec) => (
          <Card key={rec.doctor?.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <Avatar className="h-12 w-12 mt-1">
                    <AvatarFallback>{rec.doctor?.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{rec.doctor?.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {rec.doctor?.specialty}
                    </CardDescription>
                    <p className="text-xs text-gray-500 mt-1">{rec.matchReason}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="text-sm font-medium">Match</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{rec.doctor?.experienceYears} years experience</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  <span>${rec.doctor?.hourlyRate}/hr</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  asChild
                >
                  <Link href={`/doctors/${rec.doctor?.id}`}>
                    View Profile
                  </Link>
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  asChild
                >
                  <Link href={`/book/${rec.doctor?.id}`}>
                    Book Now
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
