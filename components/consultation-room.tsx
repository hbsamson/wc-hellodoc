'use client'

import { ExternalLink, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ConsultationRoomProps {
  consultationId: string
  roomName: string
  isLive?: boolean
  displayName?: string
  waitingTitle?: string
  waitingDescription?: string
}

export function ConsultationRoom({
  consultationId,
  roomName,
  isLive = true,
  displayName = 'HelloDoc Guest',
  waitingTitle = 'Waiting room',
  waitingDescription = 'The embedded video room will open when the consultation starts.',
}: ConsultationRoomProps) {
  const encodedRoomName = encodeURIComponent(roomName)
  const encodedDisplayName = encodeURIComponent(JSON.stringify(displayName))
  const roomUrl = `https://meet.jit.si/${encodedRoomName}#config.prejoinPageEnabled=false&config.requireDisplayName=false&config.startWithAudioMuted=true&config.startWithVideoMuted=true&userInfo.displayName=${encodedDisplayName}`

  return (
    <div className="flex h-full min-h-[420px] flex-col overflow-hidden rounded-md border bg-background xl:min-h-0">
      <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Video className="h-4 w-4" />
          </span>
          <div>
            <p className="font-semibold">Virtual consultation room</p>
            <p className="text-sm text-muted-foreground">
              Session {consultationId.slice(0, 8)}
            </p>
          </div>
        </div>
        {isLive ? (
          <a href={roomUrl} target="_blank" rel="noreferrer">
            <Button variant="outline" className="w-full gap-2 sm:w-auto">
              <ExternalLink className="h-4 w-4" />
              Open Room
            </Button>
          </a>
        ) : (
          <Button variant="outline" className="w-full gap-2 sm:w-auto" disabled>
            <ExternalLink className="h-4 w-4" />
            Open Room
          </Button>
        )}
      </div>
      {isLive ? (
        <iframe
          title="Embedded consultation video room"
          src={roomUrl}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="h-full min-h-[360px] w-full flex-1 border-0 xl:min-h-0"
        />
      ) : (
        <div className="flex min-h-[360px] flex-1 items-center justify-center bg-slate-950 p-6 text-center text-white xl:min-h-0">
          <div className="max-w-md">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
              <Video className="h-8 w-8" />
            </div>
            <p className="text-xl font-semibold">{waitingTitle}</p>
            <p className="mt-2 text-sm text-white/70">{waitingDescription}</p>
          </div>
        </div>
      )}
    </div>
  )
}
