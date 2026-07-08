import { useCallback } from 'react'
import { logDraftSnapshot, logKeyPress } from '../services/writingLogs'

export function useWritingLogs(roomId, userId) {
  const recordKeyPress = useCallback(
    (key) => {
      if (!roomId || !userId || !key) return

      void logKeyPress(roomId, {
        userId,
        key,
        timestamp: Date.now(),
      }).catch((error) => {
        console.error('[writingLogs] key press write failed', {
          roomId,
          userId,
          key,
          error,
        })
      })
    },
    [roomId, userId],
  )

  const recordDraft = useCallback(
    (draft) => {
      if (!roomId || !userId) return

      void logDraftSnapshot(roomId, {
        userId,
        draft,
        timestamp: Date.now(),
      }).catch((error) => {
        console.error('[writingLogs] draft write failed', {
          roomId,
          userId,
          error,
        })
      })
    },
    [roomId, userId],
  )

  return { recordKeyPress, recordDraft }
}
