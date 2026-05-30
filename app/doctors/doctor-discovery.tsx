'use client'

import Link from 'next/link'
import {
  HeartPulse,
  Search,
  ShieldPlus,
  SlidersHorizontal,
  Sparkles,
  Stethoscope,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type DoctorDiscoveryItem = {
  id: string
  name: string | null
  givenName: string | null
  lastName: string | null
  specialty: string | null
  bio: string | null
  experienceYears: number | null
  hourlyRate: string | null
  isAvailable: boolean
}

type DoctorDiscoveryProps = {
  doctors: DoctorDiscoveryItem[]
  initialQuery?: string
}

const allSpecialtiesValue = 'all-specialties'

const careNeeds = [
  {
    label: 'Fever or infection',
    description: 'Fever, chills, body aches, throat pain',
    specialties: ['Family Medicine', 'Internal Medicine', 'General Medicine', 'Pediatrics'],
    keywords: ['fever', 'infection', 'chills', 'flu', 'throat', 'aches'],
    icon: ShieldPlus,
  },
  {
    label: 'Cough or breathing',
    description: 'Cough, colds, asthma, chest tightness',
    specialties: ['Pulmonology', 'Family Medicine', 'Internal Medicine', 'Pediatrics'],
    keywords: ['cough', 'cold', 'asthma', 'breathing', 'respiratory', 'chest'],
    icon: HeartPulse,
  },
  {
    label: 'Headache or dizziness',
    description: 'Headache, migraine, vertigo, numbness',
    specialties: ['Neurology', 'Family Medicine', 'Internal Medicine'],
    keywords: ['headache', 'migraine', 'dizziness', 'vertigo', 'numbness'],
    icon: Sparkles,
  },
  {
    label: 'Skin concern',
    description: 'Rashes, acne, itchiness, skin irritation',
    specialties: ['Dermatology', 'Family Medicine'],
    keywords: ['rash', 'skin', 'acne', 'itch', 'dermatology', 'irritation'],
    icon: Stethoscope,
  },
  {
    label: 'Women\'s health',
    description: 'Pregnancy, menstrual symptoms, pelvic pain',
    specialties: ['Obstetrics and Gynecology', 'Gynecology', 'Family Medicine'],
    keywords: ['pregnancy', 'menstrual', 'pelvic', 'women', 'gynecology'],
    icon: HeartPulse,
  },
  {
    label: 'Child care',
    description: 'Pediatric fever, cough, stomach pain',
    specialties: ['Pediatrics', 'Family Medicine'],
    keywords: ['child', 'children', 'pediatric', 'baby', 'kid'],
    icon: ShieldPlus,
  },
]

export function DoctorDiscovery({ doctors, initialQuery = '' }: DoctorDiscoveryProps) {
  const [query, setQuery] = useState(initialQuery)
  const [specialty, setSpecialty] = useState(allSpecialtiesValue)
  const [selectedNeed, setSelectedNeed] = useState<string | null>(null)

  const specialties = useMemo(
    () =>
      Array.from(
        new Set(
          doctors
            .map((doctor) => doctor.specialty)
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [doctors],
  )

  const activeNeed = careNeeds.find((need) => need.label === selectedNeed)

  const filteredDoctors = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return doctors.filter((doctor) => {
      const doctorName = getDoctorName(doctor).toLowerCase()
      const doctorSpecialty = doctor.specialty?.toLowerCase() ?? ''
      const doctorBio = doctor.bio?.toLowerCase() ?? ''
      const searchableText = [doctorName, doctorSpecialty, doctorBio].join(' ')

      const matchesQuery =
        normalizedQuery.length === 0 ||
        searchableText.includes(normalizedQuery) ||
        careNeeds.some(
          (need) =>
            need.keywords.some((keyword) => keyword.includes(normalizedQuery)) &&
            need.specialties.some((needSpecialty) =>
              doctorSpecialty.includes(needSpecialty.toLowerCase()),
            ),
        )

      const matchesSpecialty =
        specialty === allSpecialtiesValue || doctor.specialty === specialty

      const matchesNeed =
        !activeNeed ||
        activeNeed.specialties.some((needSpecialty) =>
          doctorSpecialty.includes(needSpecialty.toLowerCase()),
        ) ||
        activeNeed.keywords.some((keyword) => doctorBio.includes(keyword))

      return matchesQuery && matchesSpecialty && matchesNeed
    })
  }, [activeNeed, doctors, query, specialty])

  const resetFilters = () => {
    setQuery('')
    setSpecialty(allSpecialtiesValue)
    setSelectedNeed(null)
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by symptom, specialty, or doctor name"
              className="h-11 pl-9"
            />
          </div>
          <Select value={specialty} onValueChange={setSpecialty}>
            <SelectTrigger className="h-11 w-full lg:w-72">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Filter by specialization" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={allSpecialtiesValue}>All specializations</SelectItem>
              {specialties.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" className="h-11 gap-2" onClick={resetFilters}>
            <X className="h-4 w-4" />
            Clear
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {careNeeds.map((need) => {
            const Icon = need.icon
            const isSelected = selectedNeed === need.label

            return (
              <button
                key={need.label}
                type="button"
                onClick={() => setSelectedNeed(isSelected ? null : need.label)}
                className={`rounded-lg border p-4 text-left transition-colors hover:border-primary ${
                  isSelected ? 'border-primary bg-primary/5' : 'bg-background'
                }`}
              >
                <span className="flex items-center gap-2 font-medium">
                  <Icon className="h-4 w-4 text-primary" />
                  {need.label}
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {need.description}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Available Doctors</h2>
            <p className="text-sm text-muted-foreground">
              {filteredDoctors.length} of {doctors.length} doctors match your search
            </p>
          </div>
          {activeNeed && (
            <Badge variant="secondary" className="w-fit">
              Need: {activeNeed.label}
            </Badge>
          )}
        </div>

        {filteredDoctors.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="mb-4 text-muted-foreground">
                No doctors match those filters yet.
              </p>
              <Button type="button" onClick={resetFilters}>
                Show All Doctors
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredDoctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function DoctorCard({ doctor }: { doctor: DoctorDiscoveryItem }) {
  return (
    <Card className="flex flex-col transition-colors hover:border-primary">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl">{getDoctorName(doctor)}</CardTitle>
            <CardDescription>{doctor.specialty}</CardDescription>
          </div>
          {doctor.isAvailable && (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
              Available
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge variant="outline">{doctor.experienceYears || 0} years experience</Badge>
          {doctor.hourlyRate && <Badge variant="outline">${doctor.hourlyRate}/session</Badge>}
        </div>
        {doctor.bio && (
          <p className="mb-5 line-clamp-4 text-sm text-muted-foreground">{doctor.bio}</p>
        )}
        <div className="mt-auto grid grid-cols-2 gap-2">
          <Link href={`/doctors/${doctor.id}`}>
            <Button variant="outline" className="w-full">
              View Profile
            </Button>
          </Link>
          <Link href={`/book/${doctor.id}`}>
            <Button className="w-full">Book Now</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function getDoctorName(doctor: DoctorDiscoveryItem) {
  const fullName = [doctor.givenName, doctor.lastName].filter(Boolean).join(' ')
  return doctor.name || fullName || 'Doctor'
}
