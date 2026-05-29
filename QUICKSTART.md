# HelloDoc Quick Start

Get HelloDoc running in 5 minutes!

## 1️⃣ Setup Environment

```bash
# Create .env.local
cat > .env.local << EOF
DATABASE_URL=postgresql://user:password@host/database
BETTER_AUTH_SECRET=$(openssl rand -base64 32)
EOF
```

**Need a database?** Get a free Neon PostgreSQL at [neon.tech](https://neon.tech)

## 2️⃣ Install & Run

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev
```

## 3️⃣ Open App

Visit http://localhost:3000

## 4️⃣ Create Account

1. Click "Sign Up"
2. Enter name, email, password
3. You're in! 🎉

## 5️⃣ Try Features

### As a Patient
- Browse doctors at `/doctors`
- Book a consultation
- Join video call

### As a Doctor
1. Create profile: `POST /api/doctors` with specialty
2. View consultations: `/consultations`
3. Start video calls when scheduled

## 📁 File Structure

```
app/
├── page.tsx          # Landing page
├── sign-in/          # Login
├── sign-up/          # Registration
├── dashboard/        # Dashboard
├── doctors/          # Browse doctors
├── consultations/    # Consultation list & video room
└── api/              # API routes

lib/
├── auth.ts           # Authentication
└── db/
    ├── index.ts      # Database client
    └── schema.ts     # Tables

components/
├── auth-form.tsx     # Login/signup form
└── consultation-room.tsx  # WebRTC video
```

## 🔑 Key Environment Variables

```
DATABASE_URL      = PostgreSQL connection string
BETTER_AUTH_SECRET = 32+ character random secret
```

## 🚀 Deployment

### To Vercel (Recommended)

```bash
# Push to GitHub
git add . && git commit -m "Initial" && git push

# Go to vercel.com → Import → Select repo → Add env vars → Deploy
```

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed steps.

## 🆘 Common Issues

**"Cannot find module 'better-auth'"**
```bash
pnpm install
```

**"Database connection failed"**
- Verify DATABASE_URL in `.env.local`
- Check Neon console for connection issues

**"Session not working"**
- Verify BETTER_AUTH_SECRET is set and ≥32 chars
- Clear cookies and try again

## 📚 Full Documentation

- [README.md](./README.md) - Full feature list and architecture
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Production deployment
- Better Auth: https://www.better-auth.com
- Next.js: https://nextjs.org/docs

## 💡 Next Steps

1. **Customize**: Update branding in `app/page.tsx` and `globals.css`
2. **Add Features**: Create new pages in `app/`
3. **Deploy**: Follow DEPLOYMENT_GUIDE.md for Vercel
4. **Invite Users**: Share your deployment URL

---

**That's it!** Your telehealth platform is ready. 🏥
