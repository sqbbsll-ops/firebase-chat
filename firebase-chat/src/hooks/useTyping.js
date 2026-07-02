import { useCallback, useEffect, useRef, useState } from 'react'
import { setTyping, subscribeTyping } from '../services/typing'
import { saveTypingSession } from '../services/typingSessions'

function createEmptySession(startTime) {
  return {
    keyboardEvents: [],
    indicatorEvents: [],
    sessionStartTime: startTime,
  }
}

export function useTyping(roomId, participantId, typingDelayMs) {
  const [typingUsers, setTypingUsers] = useState([])
  const hideTimer = useRef(null)
  const sessionRef = useRef(null)
  const indicatorOnRef = useRef(false)
  const endSessionRef = useRef(null)

  useEffect(() => {
    if (!roomId || !participantId) return undefined
    return subscribeTyping(roomId, participantId, setTypingUsers)
  }, [roomId, participantId])

  const ensureSession = useCallback((startTime = Date.now()) => {
    if (!sessionRef.current) {
      sessionRef.current = createEmptySession(startTime)
    }
    return sessionRef.current
  }, [])

  const persistSession = useCallback(async () => {
    const session = sessionRef.current
    sessionRef.current = null

    if (!session || session.keyboardEvents.length === 0) {
      return
    }

    try {
      await saveTypingSession({
        participantId,
        roomId,
        deltaT: typingDelayMs,
        keyboardEvents: session.keyboardEvents,
        indicatorEvents: session.indicatorEvents,
        sessionStartTime: session.sessionStartTime,
        sessionEndTime: Date.now(),
      })
    } catch (error) {
      console.error('[typingSessions] failed to save session', {
        participantId,
        roomId,
        deltaT: typingDelayMs,
        error,
      })
    }
  }, [participantId, roomId, typingDelayMs])

  const turnIndicatorOn = useCallback(async () => {
    if (!roomId || !participantId || indicatorOnRef.current) return

    const timestamp = Date.now()
    indicatorOnRef.current = true
    ensureSession(timestamp).indicatorEvents.push({ timestamp, state: 'on' })

    try {
      await setTyping(roomId, participantId, participantId, true, timestamp)
    } catch (error) {
      console.error('[typing] failed to turn indicator on', { roomId, participantId, error })
    }
  }, [roomId, participantId, ensureSession])

  const turnIndicatorOff = useCallback(async () => {
    if (!roomId || !participantId || !indicatorOnRef.current) return

    const timestamp = Date.now()
    indicatorOnRef.current = false
    sessionRef.current?.indicatorEvents.push({ timestamp, state: 'off' })

    try {
      await setTyping(roomId, participantId, participantId, false)
    } catch (error) {
      console.error('[typing] failed to turn indicator off', { roomId, participantId, error })
    }
  }, [roomId, participantId])

  const endSession = useCallback(async () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current)
      hideTimer.current = null
    }

    try {
      await turnIndicatorOff()
    } finally {
      await persistSession()
    }
  }, [turnIndicatorOff, persistSession])

  useEffect(() => {
    endSessionRef.current = endSession
  }, [endSession])

  const scheduleHideTyping = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current)
    }

    hideTimer.current = setTimeout(() => {
      hideTimer.current = null
      void endSessionRef.current?.()
    }, typingDelayMs)
  }, [typingDelayMs])

  const recordKeyboardEvent = useCallback(
    (type) => {
      const timestamp = Date.now()
      ensureSession(timestamp).keyboardEvents.push({ timestamp, type })
    },
    [ensureSession],
  )

  const notifyTyping = useCallback(
    (isTyping) => {
      if (!roomId || !participantId) return

      if (hideTimer.current) {
        clearTimeout(hideTimer.current)
        hideTimer.current = null
      }

      if (!isTyping) {
        scheduleHideTyping()
        return
      }

      void turnIndicatorOn()
      scheduleHideTyping()
    },
    [roomId, participantId, scheduleHideTyping, turnIndicatorOn],
  )

  const cancelTypingSession = useCallback(async () => {
    await endSession()
  }, [endSession])

  useEffect(() => {
    function flushOnPageHide() {
      if (sessionRef.current?.keyboardEvents.length) {
        void endSessionRef.current?.()
      }
    }

    window.addEventListener('pagehide', flushOnPageHide)
    return () => {
      window.removeEventListener('pagehide', flushOnPageHide)
      if (hideTimer.current) clearTimeout(hideTimer.current)
      if (indicatorOnRef.current && roomId && participantId) {
        void setTyping(roomId, participantId, participantId, false)
      }
    }
  }, [roomId, participantId])

  return {
    typingUsers,
    notifyTyping,
    recordKeyboardEvent,
    cancelTypingSession,
  }
}
