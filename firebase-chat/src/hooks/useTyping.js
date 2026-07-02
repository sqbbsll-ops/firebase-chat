import { useCallback, useEffect, useRef, useState } from 'react'
import { setTyping, subscribeTyping } from '../services/typing'

export function useTyping(chatId, participantId, typingDelayMs) {
  const [typingUsers, setTypingUsers] = useState([])
  const hideTimer = useRef(null)

  useEffect(() => {
    if (!chatId || !participantId) return undefined
    return subscribeTyping(chatId, participantId, setTypingUsers)
  }, [chatId, participantId])

  const clearTypingState = useCallback(async () => {
    if (!chatId || !participantId) return
    await setTyping(chatId, participantId, participantId, false)
  }, [chatId, participantId])

  const scheduleHideTyping = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current)
    }

    hideTimer.current = setTimeout(() => {
      clearTypingState()
      hideTimer.current = null
    }, typingDelayMs)
  }, [clearTypingState, typingDelayMs])

  const notifyTyping = useCallback(
    (isTyping) => {
      if (!chatId || !participantId) return

      if (hideTimer.current) {
        clearTimeout(hideTimer.current)
        hideTimer.current = null
      }

      if (!isTyping) {
        scheduleHideTyping()
        return
      }

      setTyping(chatId, participantId, participantId, true, Date.now())
      scheduleHideTyping()
    },
    [chatId, participantId, scheduleHideTyping],
  )

  const cancelTypingSession = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current)
      hideTimer.current = null
    }
    clearTypingState()
  }, [clearTypingState])

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
      clearTypingState()
    }
  }, [clearTypingState])

  return { typingUsers, notifyTyping, cancelTypingSession }
}
