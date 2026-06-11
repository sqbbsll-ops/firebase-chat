import { useEffect, useMemo, useState } from 'react'
import { subscribeTypingLogs } from '../services/typingLogs'

/** Typing logs from other users (not visible to the typer). */
export function useTypingLogs(roomId, currentUserId) {
  const [logs, setLogs] = useState([])

  useEffect(() => {
    if (!roomId) return undefined
    return subscribeTypingLogs(roomId, setLogs, console.error)
  }, [roomId])

  return useMemo(
    () => logs.filter((log) => log.typerId !== currentUserId),
    [logs, currentUserId],
  )
}
