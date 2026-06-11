import { useCallback, useEffect, useRef, useState } from 'react'
import { setTyping, subscribeTyping } from '../services/typing'
import { saveTypingLog } from '../services/typingLogs'

const TYPING_IDLE_MS = 10_000

function getLastMessageIdForUser(messages, userId) {
  const userMessages = messages.filter((m) => m.senderId === userId)
  return userMessages[userMessages.length - 1]?.id ?? null
}

export function useTyping(chatId, user, messages) {
  const [typingUsers, setTypingUsers] = useState([])
  const stopTimer = useRef(null)
  const sessionStartRef = useRef(null)
  const messagesRef = useRef(messages)

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    if (!chatId || !user?.uid) return undefined
    return subscribeTyping(chatId, user.uid, setTypingUsers)
  }, [chatId, user?.uid])

  const endTypingSession = useCallback(
    async (save = true) => {
      if (stopTimer.current) {
        clearTimeout(stopTimer.current)
        stopTimer.current = null
      }

      if (!chatId || !user?.uid) return

      const displayName = user.displayName || user.email || 'User'
      const start = sessionStartRef.current
      sessionStartRef.current = null

      await setTyping(chatId, user.uid, displayName, false)

      if (!save || !start) return

      const durationMs = Date.now() - start
      if (durationMs <= 0) return

      const anchorMessageId = getLastMessageIdForUser(
        messagesRef.current,
        user.uid,
      )
      if (!anchorMessageId) return

      saveTypingLog(chatId, {
        typerId: user.uid,
        durationMs,
        anchorMessageId,
      }).catch(console.error)
    },
    [chatId, user],
  )

  const notifyTyping = useCallback(
    (isTyping) => {
      if (!chatId || !user?.uid) return

      const displayName = user.displayName || user.email || 'User'

      if (stopTimer.current) {
        clearTimeout(stopTimer.current)
        stopTimer.current = null
      }

      if (!isTyping) {
        endTypingSession(true)
        return
      }

      if (!sessionStartRef.current) {
        sessionStartRef.current = Date.now()
      }

      setTyping(
        chatId,
        user.uid,
        displayName,
        true,
        sessionStartRef.current,
      )

      stopTimer.current = setTimeout(() => {
        endTypingSession(true)
        stopTimer.current = null
      }, TYPING_IDLE_MS)
    },
    [chatId, user, endTypingSession],
  )

  const cancelTypingSession = useCallback(() => {
    endTypingSession(false)
  }, [endTypingSession])

  useEffect(() => {
    return () => {
      endTypingSession(false)
    }
  }, [endTypingSession])

  return { typingUsers, notifyTyping, cancelTypingSession }
}
