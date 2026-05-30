'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BellRing, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export type AppointmentNotification = {
  id: string
  title: string
  body: string
  time: string
  href: string
  priority: 'high' | 'normal'
}

export function NotificationsFeed({
  notifications,
}: {
  notifications: AppointmentNotification[]
}) {
  const router = useRouter()
  const [alertsEnabled, setAlertsEnabled] = useState(false)
  const newestNotification = notifications[0]
  const notificationKey = useMemo(
    () => notifications.map((notification) => notification.id).join('|'),
    [notifications],
  )

  useEffect(() => {
    const interval = window.setInterval(() => {
      router.refresh()
    }, 30000)

    return () => window.clearInterval(interval)
  }, [router])

  useEffect(() => {
    if (
      !alertsEnabled ||
      !newestNotification ||
      typeof window === 'undefined' ||
      !('Notification' in window) ||
      Notification.permission !== 'granted'
    ) {
      return
    }

    const seenKey = `hellodoc-notification:${newestNotification.id}`
    if (window.sessionStorage.getItem(seenKey)) {
      return
    }

    window.sessionStorage.setItem(seenKey, 'true')
    new Notification(newestNotification.title, {
      body: newestNotification.body,
    })
  }, [alertsEnabled, newestNotification, notificationKey])

  async function enableAlerts() {
    if (!('Notification' in window)) {
      return
    }

    const permission = await Notification.requestPermission()
    setAlertsEnabled(permission === 'granted')
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Bookings, upcoming appointments, and schedule updates.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => router.refresh()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button className="gap-2" onClick={enableAlerts}>
            <BellRing className="h-4 w-4" />
            Alerts
          </Button>
        </div>
      </div>

      {notifications.length > 0 ? (
        <div className="grid gap-3">
          {notifications.map((notification) => (
            <a
              key={notification.id}
              href={notification.href}
              className="block rounded-md border bg-card p-4 transition-colors hover:border-primary"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{notification.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {notification.body}
                  </p>
                </div>
                <span
                  className={
                    notification.priority === 'high'
                      ? 'rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary'
                      : 'text-xs text-muted-foreground'
                  }
                >
                  {notification.time}
                </span>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No appointment notifications yet.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
