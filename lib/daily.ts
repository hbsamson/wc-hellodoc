/**
 * Daily.co API helpers – rooms + meeting-tokens.
 *
 * Required env var:  DAILY_API_KEY   (server-only)
 */

const DAILY_API_BASE = 'https://api.daily.co/v1'

/**
 * Creates a Daily.co room. If the room already exists the existing
 * room info is returned instead of throwing an error.
 */
export async function createDailyRoom(roomName: string) {
  const apiKey = process.env.DAILY_API_KEY
  if (!apiKey) {
    throw new Error(
      'DAILY_API_KEY is not set – cannot create video-call rooms.',
    )
  }

  const res = await fetch(`${DAILY_API_BASE}/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      name: roomName,
      privacy: 'public',
      properties: {
        enable_chat: false,
        start_video_off: true,
        start_audio_off: true,
      },
    }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(
      `Daily.co room creation failed (${res.status}): ${JSON.stringify(body)}`,
    )
  }

  return res.json() as Promise<{
    id: string
    name: string
    url: string
  }>
}

/**
 * Generates a meeting token that pre-sets the participant's display name
 * so they never see the "Enter your name" prompt.
 *
 * @param roomName  The room to grant access to
 * @param userName  Display name to attach to the token
 * @param isOwner   Whether the participant should be a meeting owner (moderator)
 */
export async function getMeetingToken(
  roomName: string,
  userName: string,
  isOwner = false,
) {
  const apiKey = process.env.DAILY_API_KEY
  if (!apiKey) {
    throw new Error('DAILY_API_KEY is not set – cannot create meeting tokens.')
  }

  const res = await fetch(`${DAILY_API_BASE}/meeting-tokens`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        user_name: userName,
        is_owner: isOwner,
      },
    }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(
      `Daily.co token creation failed (${res.status}): ${JSON.stringify(body)}`,
    )
  }

  const data = await res.json() as { token: string }
  return data.token
}