'use client'

import { useEffect, useRef, useState } from 'react'
import SimplePeer from 'simple-peer'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react'

interface ConsultationRoomProps {
  consultationId: string
  isDoctor: boolean
  onEnd?: () => void
}

export function ConsultationRoom({
  consultationId,
  isDoctor,
  onEnd,
}: ConsultationRoomProps) {
  const [peer, setPeer] = useState<SimplePeer.Instance | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    const initPeer = async () => {
      try {
        // Get local media stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }
        localStreamRef.current = stream

        // Create peer connection
        const newPeer = new SimplePeer({
          initiator: isDoctor, // Doctor initiates the call
          trickleICE: false,
          stream: stream,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
            ],
          },
        })

        newPeer.on('signal', (data) => {
          // Send signal data through WebSocket or API
          console.log('Signal:', data)
        })

        newPeer.on('connect', () => {
          setIsConnected(true)
        })

        newPeer.on('stream', (stream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream
          }
        })

        newPeer.on('error', (err) => {
          console.error('Peer error:', err)
        })

        setPeer(newPeer)
      } catch (error) {
        console.error('Failed to initialize peer:', error)
      }
    }

    initPeer()

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (peer) {
        peer.destroy()
      }
    }
  }, [isDoctor])

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isMuted
      })
      setIsMuted(!isMuted)
    }
  }

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = isVideoOff
      })
      setIsVideoOff(!isVideoOff)
    }
  }

  const handleEndCall = () => {
    if (peer) {
      peer.destroy()
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
    }
    onEnd?.()
  }

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      {/* Remote video */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />

      {/* Local video (picture-in-picture) */}
      <div className="absolute bottom-4 right-4 w-32 h-32 bg-gray-900 rounded-lg overflow-hidden border-2 border-primary">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover transform scale-x-[-1]"
        />
      </div>

      {/* Controls */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-4">
        <Button
          size="lg"
          variant={isMuted ? 'destructive' : 'default'}
          onClick={toggleMute}
          className="rounded-full w-14 h-14 p-0"
        >
          {isMuted ? (
            <MicOff className="w-6 h-6" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </Button>

        <Button
          size="lg"
          variant={isVideoOff ? 'destructive' : 'default'}
          onClick={toggleVideo}
          className="rounded-full w-14 h-14 p-0"
        >
          {isVideoOff ? (
            <VideoOff className="w-6 h-6" />
          ) : (
            <Video className="w-6 h-6" />
          )}
        </Button>

        <Button
          size="lg"
          variant="destructive"
          onClick={handleEndCall}
          className="rounded-full w-14 h-14 p-0"
        >
          <PhoneOff className="w-6 h-6" />
        </Button>
      </div>

      {/* Connection status */}
      {!isConnected && (
        <div className="absolute top-4 left-4 bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm">
          Connecting...
        </div>
      )}
      {isConnected && (
        <div className="absolute top-4 left-4 bg-green-500 text-white px-4 py-2 rounded-lg text-sm">
          Connected
        </div>
      )}
    </div>
  )
}
