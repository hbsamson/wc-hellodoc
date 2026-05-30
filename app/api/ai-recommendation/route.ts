import { NextRequest, NextResponse } from 'next/server'
import { sendRecommendationMessage } from '@/app/actions/ai-recommendation'

export async function POST(req: NextRequest) {
  try {
    const { chatId, message } = await req.json()

    if (!chatId || !message) {
      return NextResponse.json({ error: 'Missing chatId or message' }, { status: 400 })
    }

    const result = await sendRecommendationMessage(chatId, message)

    return NextResponse.json(result)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
