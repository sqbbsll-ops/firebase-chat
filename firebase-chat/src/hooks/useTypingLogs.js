import { useEffect, useMemo, useState } from 'react'
import { subscribeTypingLogs } from '../services/typingLogs'

/** Map anchor message id → latest typing log from other users. */
export function useTypingLogs(roomId, currentUserId) {
  const [logs, setLogs] = useState([])

  useEffect(() => {
    if (!roomId) return undefined
    return subscribeTypingLogs(roomId, setLogs, console.error)
  }, [roomId])

  const logsByMessageId = useMemo(() => {
    const map = {}
    logs
      .filter((log) => log.typerId !== currentUserId)
      .forEach((log) => {
        if (!log.anchorMessageId || map[log.anchorMessageId]) return
        map[log.anchorMessageId] = log
      })
    return map
  }, [logs, currentUserId])

  return logsByMessageId
}
