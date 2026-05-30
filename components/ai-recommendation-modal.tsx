'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { AIRecommendationChat } from './ai-recommendation-chat'
import { RecommendationResults } from './recommendation-results'
import { createRecommendationChat } from '@/app/actions/ai-recommendation'

interface AIRecommendationModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AIRecommendationModal({ isOpen, onClose }: AIRecommendationModalProps) {
  const [chatId, setChatId] = useState<string>('')
  const [recommendations, setRecommendations] = useState<string[]>([])
  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (isOpen && !chatId) {
      initializeChat()
    }
  }, [isOpen, chatId])

  const initializeChat = async () => {
    setIsInitializing(true)
    setError('')
    try {
      const newChatId = await createRecommendationChat()
      setChatId(newChatId)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create chat'
      setError(errorMsg)
      console.error('Failed to create chat:', err)
    } finally {
      setIsInitializing(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset state on close
      setChatId('')
      setRecommendations([])
      setError('')
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl h-[700px] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>Find the Right Doctor for You</DialogTitle>
          <DialogDescription>
            Describe your symptoms and let AI help match you with the perfect specialist
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col px-6 py-4">
          {isInitializing ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-sm text-gray-500">Starting chat...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-red-500 mb-4">{error}</p>
                <Button onClick={initializeChat}>Try Again</Button>
              </div>
            </div>
          ) : chatId ? (
            recommendations.length === 0 ? (
              <AIRecommendationChat
                chatId={chatId}
                onRecommendationsReceived={setRecommendations}
              />
            ) : (
              <div className="overflow-auto">
                <RecommendationResults chatId={chatId} specialties={recommendations} />
              </div>
            )
          ) : null}
        </div>

        <div className="border-t px-6 py-4 flex justify-end">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

