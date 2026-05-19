import { useCallback, useEffect } from 'react'
import { markMessagesAsRead } from '../services/messages'

/**
 * Mark others' messages as read only while the chat tab is visible.
 */
export function useReadReceipts(roomId, currentUserId, messages) {
  const tryMarkAsRead = useCallback(() => {
    if (!roomId || !currentUserId || document.visibilityState !== 'visible') {
      return
    }

    const hasUnreadFromOthers = messages.some(
      (m) => m.senderId !== currentUserId && m.readAt == null,
    )

    if (hasUnreadFromOthers) {
      markMessagesAsRead(roomId, currentUserId).catch(console.error)
    }
  }, [roomId, currentUserId, messages])

  useEffect(() => {
    tryMarkAsRead()
  }, [tryMarkAsRead])

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        tryMarkAsRead()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [tryMarkAsRead])
}
