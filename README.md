# HelloDoc - Telehealth Platform

A modern, full-featured telehealth application that connects patients with licensed healthcare professionals for online consultations.

## 🚀 Features

### For Patients
- **Browse Doctors**: Search and filter healthcare professionals by specialty
- **Easy Booking**: Schedule consultations with available doctors
- **Video Consultations**: Connect with doctors via secure WebRTC video calls
- **Consultation History**: View past and upcoming consultations
- **Doctor Reviews**: Rate and review doctors after consultations

### For Doctors
- **Manage Profile**: Create and update your professional profile
- **Consultation Management**: Accept and manage patient consultations
- **Video Consultations**: Conduct secure video consultations with patients
- **Notes**: Add follow-up notes and recommendations after consultations

## 📚 Tech Stack

### Frontend
- **Framework**: Next.js 16 (TypeScript)
- **UI**: shadcn/ui + Tailwind CSS
- **Real-time Communication**: WebRTC with Simple-peer
- **Authentication**: Better Auth (JWT-based)

### Backend
- **Runtime**: Next.js API Routes
- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle ORM
- **Authentication**: Better Auth

### Infrastructure
- **Deployment**: Vercel
- **Database**: Neon PostgreSQL

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+
- pnpm (or npm/yarn)
- Neon PostgreSQL database
- Environment variables configured

### Environment Setup

1. Create a `.env.local` file with the following variables:

```env
# Database
DATABASE_URL=postgresql://user:password@host/database

# Authentication
BETTER_AUTH_SECRET=your-random-secret-key-here-min-32-chars
BETTER_AUTH_URL=http://localhost:3000 # For development, can be omitted
```

**Generate BETTER_AUTH_SECRET:**
```bash
openssl rand -base64 32
```

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd hellodoc

# Install dependencies
pnpm install

# Initialize database schema
# The database is automatically initialized through Neon integration

# Run development server
pnpm dev
```

Visit `http://localhost:3000` to access the application.

## 📁 Project Structure

```
app/
├── (auth)/
│   ├── sign-in/              # Sign in page
│   ├── sign-up/              # Sign up page
│   └── layout.tsx            # Auth layout
├── api/
│   ├── auth/                 # Better Auth handlers
│   ├── consultations/        # Consultation API routes
│   └── doctors/              # Doctors API routes
├── consultations/            # Consultation pages
│   └── [id]/                 # Consultation detail with video room
├── dashboard/                # User dashboard
├── doctors/                  # Doctors listing
├── book/                     # Booking pages
├── layout.tsx                # Root layout
├── globals.css               # Global styles
└── page.tsx                  # Landing page

lib/
├── auth.ts                   # Better Auth configuration
├── auth-client.ts            # Better Auth client
└── db/
    ├── index.ts              # Drizzle instance
    └── schema.ts             # Database schema

components/
├── auth-form.tsx             # Sign in/up form
├── consultation-room.tsx     # WebRTC video consultation component
└── ui/                       # shadcn/ui components

actions/
├── helpers.ts                # Helper functions
├── doctors.ts                # Doctor-related server actions
└── consultations.ts          # Consultation-related server actions
```

## 🗄️ Database Schema

### Core Tables

#### `user`
- Better Auth required table
- Stores user account information
- Fields: id, name, email, emailVerified, image, timestamps

#### `doctor_profiles`
- Doctor-specific information
- Fields: id, userId, specialty, bio, licenseNumber, experienceYears, hourlyRate, availability

#### `consultations`
- Consultation bookings and history
- Fields: id, patientId, doctorId, status, scheduledAt, startedAt, endedAt, notes

#### `prescriptions`
- Doctor prescriptions from consultations
- Fields: id, consultationId, patientId, doctorId, medications, instructions

#### `reviews`
- Patient reviews of doctors
- Fields: id, doctorId, patientId, rating, comment

## 🔐 Authentication Flow

1. User signs up/in via email and password
2. Better Auth creates a session and sets HTTP-only cookies
3. Session is verified server-side for protected routes
4. User role is determined by doctor profile existence

## 📹 WebRTC Video Consultations

The `ConsultationRoom` component handles video calls using:
- **Simple-peer**: WebRTC abstraction
- **getUserMedia**: Access to user's camera/microphone
- **STUN servers**: NAT traversal
- **Picture-in-picture**: Local video in corner, remote video full screen

### Features
- Mute/unmute audio
- Toggle video on/off
- End call button
- Connection status indicator

## 🚀 Deployment

### Deploy to Vercel

```bash
# Push to GitHub
git push origin main

# Vercel auto-deploys on push
# Or manually deploy:
vercel deploy --prod
```

### Environment Variables on Vercel
1. Go to Project Settings → Environment Variables
2. Add the required environment variables
3. Redeploy

## 📝 API Endpoints

### Consultations
- `POST /api/consultations/book` - Book a new consultation
- `POST /api/consultations/[id]/start` - Start a consultation (doctor only)
- `POST /api/consultations/[id]/end` - End a consultation (doctor only)

### Doctors
- `GET /api/doctors` - Get all available doctors
- `GET /api/doctors/[id]` - Get doctor details

## 🔄 Server Actions

### Doctors (`app/actions/doctors.ts`)
- `createDoctorProfile()` - Create doctor profile
- `getDoctorProfile()` - Get doctor profile
- `updateDoctorProfile()` - Update doctor profile
- `getAllDoctors()` - Get all available doctors
- `getDoctorReviews()` - Get reviews for a doctor
- `addReview()` - Add review for a doctor

### Consultations (`app/actions/consultations.ts`)
- `bookConsultation()` - Book a consultation
- `getPatientConsultations()` - Get patient's consultations
- `getDoctorConsultations()` - Get doctor's consultations
- `startConsultation()` - Start a consultation
- `endConsultation()` - End a consultation with notes
- `cancelConsultation()` - Cancel a consultation

## 🎨 Customization

### Colors
Edit `/app/globals.css` to customize the color scheme. The design uses CSS variables for theming:
- `--primary`: Main brand color (blue/teal)
- `--accent`: Secondary highlight color
- `--muted`: Muted backgrounds

### Adding New Features

1. **Database**: Add tables to `lib/db/schema.ts`
2. **Server Actions**: Add actions in `app/actions/`
3. **API Routes**: Add routes in `app/api/`
4. **UI**: Create components in `components/`
5. **Pages**: Add pages in `app/`

## 🐛 Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check Neon console for connection availability
- Ensure IP whitelist if applicable

### Authentication Not Working
- Verify `BETTER_AUTH_SECRET` is set and ≥32 characters
- Check cookies in browser DevTools
- Clear browser cache if issues persist

### WebRTC Video Not Working
- Check browser permissions for camera/microphone
- Verify STUN servers are accessible
- Check browser console for errors
- Ensure both parties allow media access

## 📄 License

MIT License - feel free to use for personal or commercial projects

## 🤝 Support

For issues or questions, please refer to:
- Better Auth Docs: https://www.better-auth.com
- Next.js Docs: https://nextjs.org/docs
- Drizzle ORM: https://orm.drizzle.team
- WebRTC Guide: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API

---

Built with ❤️ using Next.js, Neon, and Better Auth
