# HelloDoc Deployment Guide

Complete guide for deploying HelloDoc to production and getting it running locally for development.

## Local Development Setup

### 1. Prerequisites
- Node.js 18+ and pnpm installed
- A Neon PostgreSQL database (free tier available at neon.tech)
- Git installed

### 2. Clone & Install

```bash
# Clone the project
git clone <your-repo-url> hellodoc
cd hellodoc

# Install dependencies
pnpm install
```

### 3. Database Setup

#### Option A: Using Neon (Recommended)
1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project and copy the connection string
3. The connection string will look like: `postgresql://user:password@host.neon.tech/dbname`

#### Option B: Local PostgreSQL
```bash
# Install PostgreSQL locally
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql

# Create database
createdb hellodoc

# Connection string format
postgresql://postgres:password@localhost:5432/hellodoc
```

### 4. Environment Configuration

Create `.env.local` in the project root:

```env
# Database connection
DATABASE_URL=postgresql://user:password@host/database

# Better Auth secret (generate with: openssl rand -base64 32)
BETTER_AUTH_SECRET=your-secret-key-here-32-chars-minimum

# Optional - Better Auth URL (auto-detected in development)
# BETTER_AUTH_URL=http://localhost:3000
```

**Generate BETTER_AUTH_SECRET:**
```bash
# macOS/Linux
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((1..24 | ForEach-Object { [char](Get-Random -Minimum 33 -Maximum 127) } | Join-Object)))
```

### 5. Initialize Database

The database schema is created automatically when the app starts. The schema includes:
- Better Auth tables (user, session, account, verification)
- HelloDoc tables (doctor_profiles, consultations, prescriptions, reviews)
- Indexes for performance

### 6. Run Development Server

```bash
pnpm dev
```

Visit http://localhost:3000 to access the app.

## Vercel Deployment

### Prerequisites
- Vercel account (free tier available)
- GitHub repository with HelloDoc code
- Neon account for database

### Step 1: Setup Neon Database

1. Create a Neon project at neon.tech
2. Copy the connection string (connection details → Connection string)
3. Save it for later

### Step 2: Setup GitHub Repository

```bash
# Initialize git repo
git init

# Add files
git add .

# Commit
git commit -m "Initial commit: HelloDoc telehealth app"

# Add remote (replace with your GitHub repo URL)
git remote add origin https://github.com/yourusername/hellodoc.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Select the repository "hellodoc"
5. Click "Import"

### Step 4: Configure Environment Variables

In Vercel project settings:

1. Go to Settings → Environment Variables
2. Add the following:
   - **Key**: `DATABASE_URL`
     **Value**: Your Neon connection string
   - **Key**: `BETTER_AUTH_SECRET`
     **Value**: Your 32+ character secret (generate locally and copy)
   - **Key**: `NODE_ENV`
     **Value**: `production`

3. Click "Save"

### Step 5: Deploy

1. Click "Deploy"
2. Wait for deployment to complete
3. Visit the provided URL to access your HelloDoc instance

## Production Checklist

- [ ] Database is running on Neon
- [ ] Environment variables are set on Vercel
- [ ] BETTER_AUTH_SECRET is securely generated and set
- [ ] DATABASE_URL points to production database
- [ ] Custom domain configured (if desired)
- [ ] SSL certificate is active
- [ ] CORS is properly configured
- [ ] Rate limiting is in place
- [ ] Monitoring is enabled
- [ ] Backups are configured

## Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED
```
**Solution**: 
- Check DATABASE_URL is correct
- Verify Neon project is running
- Check IP whitelist in Neon console

### Better Auth Error
```
Error: Unauthorized - Missing BETTER_AUTH_SECRET
```
**Solution**:
- Generate a new secret: `openssl rand -base64 32`
- Set in environment variables
- Restart dev server or redeploy

### Port 3000 Already in Use
```
Error: listen EADDRINUSE :::3000
```
**Solution**:
```bash
# macOS/Linux
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### WebRTC Connection Failed
**Solution**:
- Check browser console for errors
- Verify camera/microphone permissions
- STUN servers must be accessible
- May require TURN server in production

## Scaling & Performance

### Database Optimization
- Indexes are created on foreign keys
- Use query results caching
- Monitor slow queries in Neon dashboard

### Vercel Serverless Functions
- Cold starts are usually <500ms
- Optimize bundle size with code splitting
- Use ISR (Incremental Static Regeneration) for doctor lists

### WebRTC Scaling
- Use TURN servers for production
- Implement signaling server for complex topologies
- Consider adding video transcoding for many concurrent calls

## Monitoring & Logging

### Enable Vercel Analytics
1. Go to project Settings → Analytics
2. Enable Web Vitals

### Application Monitoring
```bash
# View logs locally
pnpm dev --log

# Remote logs on Vercel
vercel logs <function-name>
```

## Backup & Recovery

### Database Backups
Neon automatically creates backups. To restore:
1. Go to Neon console
2. Go to Branches
3. Select restore point
4. Create new database from backup

### Application Rollback
```bash
# On Vercel: Click previous deployment → Promote to Production
# Or revert code and push to GitHub
```

## Security Considerations

1. **Environment Variables**: Never commit secrets
2. **HTTPS**: Always enabled on Vercel
3. **CORS**: Configured for Vercel domains
4. **Database**: Use strong passwords, IP whitelist
5. **Sessions**: HTTP-only cookies, 7-day expiration
6. **Input Validation**: Implemented on server-side
7. **Rate Limiting**: Implement for production

## Next Steps

1. **Customize Branding**: Update logo and colors
2. **Add Payment**: Integrate Stripe for premium features
3. **Email Notifications**: Add email service for appointment reminders
4. **Analytics**: Integrate analytics to track usage
5. **Support Chat**: Add customer support widget

## Getting Help

- Better Auth Docs: https://www.better-auth.com
- Vercel Docs: https://vercel.com/docs
- Neon Docs: https://neon.tech/docs
- Next.js Docs: https://nextjs.org/docs

---

Ready to deploy? Follow the Vercel Deployment section above!
