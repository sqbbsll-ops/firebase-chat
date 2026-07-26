import { useCallback } from 'react'
import { logDraftSnapshot, logKeyPress } from '../services/writingLogs'

export function useWritingLogs(roomId, userId, groupId) {
  const recordKeyPress = useCallback(
    (key) => {
      if (!roomId || !userId || !groupId || !key) return

      void logKeyPress(roomId, {
        userId,
        groupId,
        key,
        timestamp: Date.now(),
      }).catch((error) => {
        console.error('[writingLogs] key press write failed', {
          roomId,
          userId,
          groupId,
          key,
          error,
        })
      })
    },
    [roomId, userId, groupId],
  )

  const recordDraft = useCallback(
    (draft) => {
      if (!roomId || !userId || !groupId) return

      void logDraftSnapshot(roomId, {
        userId,
        groupId,
        draft,
        timestamp: Date.now(),
      }).catch((error) => {
        console.error('[writingLogs] draft write failed', {
          roomId,
          userId,
          groupId,
          error,
        })
      })
    },
    [roomId, userId, groupId],
  )

  return { recordKeyPress, recordDraft }
}
