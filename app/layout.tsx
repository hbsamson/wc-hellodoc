import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getUserRole } from "@/app/actions/helpers";
import {
  AuthTopBar,
  DashboardNav,
  PublicNav,
} from "@/app/dashboard/dashboard-nav";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HelloDoc - Telehealth Platform",
  description:
    "Connect with healthcare professionals online. Book consultations, get prescriptions, and access quality healthcare from home.",
  generator: "v0.app",
  icons: {
    apple: "/apple-icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({ headers: await headers() });
  const userRole = session?.user ? await getUserRole() : null;
  const userType = userRole === "doctor" ? "doctor" : "patient";

  return (
    <html lang="en" className="bg-background" suppressHydrationWarning>
      <meta name="apple-mobile-web-app-title" content="HelloDoc" />
      <body className="font-sans antialiased bg-background">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {session?.user ? (
            <div className="min-h-screen">
              <input
                id="app-sidebar-expanded"
                type="checkbox"
                defaultChecked
                className="peer/sidebar sr-only"
                aria-hidden="true"
              />
              <AuthTopBar
                userName={session.user.name || ""}
                userEmail={session.user.email || ""}
                userType={userType}
              />
              <DashboardNav
                userType={userType}
                toggleId="app-sidebar-expanded"
              />
              <div className="app-content pt-32 transition-[padding] duration-200 lg:pt-16">
                {children}
              </div>
            </div>
          ) : (
            <>
              <PublicNav />
              {children}
            </>
          )}
        </ThemeProvider>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}
