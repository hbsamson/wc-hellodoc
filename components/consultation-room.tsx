'use client'

import { ExternalLink, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ConsultationRoomProps {
  consultationId: string
  roomName: string
}

export function ConsultationRoom({
  consultationId,
  roomName,
}: ConsultationRoomProps) {
  const encodedRoomName = encodeURIComponent(roomName)
  const roomUrl = `https://meet.jit.si/${encodedRoomName}#config.prejoinPageEnabled=true&config.startWithAudioMuted=true&config.startWithVideoMuted=true`

  return (
    <div className="flex h-full min-h-[560px] flex-col overflow-hidden rounded-md border bg-background">
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
        <a href={roomUrl} target="_blank" rel="noreferrer">
          <Button variant="outline" className="w-full gap-2 sm:w-auto">
            <ExternalLink className="h-4 w-4" />
            Open Room
          </Button>
        </a>
      </div>
      <iframe
        title="Embedded consultation video room"
        src={roomUrl}
        allow="camera; microphone; fullscreen; display-capture; autoplay"
        className="h-full min-h-[500px] w-full flex-1 border-0"
      />
    </div>
  )
}
