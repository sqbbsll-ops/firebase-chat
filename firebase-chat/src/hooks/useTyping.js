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
    console.log('[debug] useTyping mounted', { roomId, participantId, typingDelayMs })
    if (!roomId || !participantId) return undefined
    return subscribeTyping(roomId, participantId, setTypingUsers)
  }, [roomId, participantId, typingDelayMs])

  const ensureSession = useCallback((startTime = Date.now()) => {
    if (!sessionRef.current) {
      sessionRef.current = createEmptySession(startTime)
      console.log('[debug] session created', {
        roomId,
        participantId,
        sessionStartTime: startTime,
      })
    }
    return sessionRef.current
  }, [roomId, participantId])

  const persistSession = useCallback(async () => {
    const session = sessionRef.current
    sessionRef.current = null

    if (!session || session.keyboardEvents.length === 0) {
      console.log('[debug] persist skipped', {
        roomId,
        participantId,
        hasSession: Boolean(session),
        keyboardEventCount: session?.keyboardEvents.length ?? 0,
      })
      return
    }

    const sessionData = {
      participantId,
      roomId,
      deltaT: typingDelayMs,
      keyboardEvents: session.keyboardEvents,
      indicatorEvents: session.indicatorEvents,
      sessionStartTime: session.sessionStartTime,
      sessionEndTime: Date.now(),
    }

    console.log('[debug] saving session:', sessionData)

    try {
      await saveTypingSession(sessionData)
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
    console.log('[debug] indicator on', { roomId, participantId, timestamp })

    try {
      await setTyping(roomId, participantId, participantId, true, timestamp)
    } catch (error) {
      console.error('[typing] failed to turn indicator on', { roomId, participantId, error })
    }
  }, [roomId, participantId, ensureSession])

  const turnIndicatorOff = useCallback(async () => {
    if (!roomId || !participantId || !indicatorOnRef.current) {
      console.log('[debug] indicator off skipped', {
        roomId,
        participantId,
        indicatorOn: indicatorOnRef.current,
      })
      return
    }

    const timestamp = Date.now()
    indicatorOnRef.current = false
    sessionRef.current?.indicatorEvents.push({ timestamp, state: 'off' })
    console.log('[debug] indicator off', { roomId, participantId, timestamp })

    try {
      await setTyping(roomId, participantId, participantId, false)
    } catch (error) {
      console.error('[typing] failed to turn indicator off', { roomId, participantId, error })
    }
  }, [roomId, participantId])

  const endSession = useCallback(async () => {
    console.log('[debug] session ending...', {
      roomId,
      participantId,
      keyboardEventCount: sessionRef.current?.keyboardEvents.length ?? 0,
    })

    if (hideTimer.current) {
      clearTimeout(hideTimer.current)
      hideTimer.current = null
    }

    try {
      await turnIndicatorOff()
    } finally {
      await persistSession()
    }
  }, [turnIndicatorOff, persistSession, roomId, participantId])

  useEffect(() => {
    endSessionRef.current = endSession
  }, [endSession])

  const scheduleHideTyping = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current)
    }

    console.log('[debug] hide timer scheduled', {
      roomId,
      participantId,
      typingDelayMs,
    })

    hideTimer.current = setTimeout(() => {
      hideTimer.current = null
      console.log('[debug] hide timer fired', { roomId, participantId })
      void endSessionRef.current?.()
    }, typingDelayMs)
  }, [roomId, participantId, typingDelayMs])

  const recordKeyboardEvent = useCallback(
    (type) => {
      const timestamp = Date.now()
      ensureSession(timestamp).keyboardEvents.push({ timestamp, type })
      console.log('[debug] keyboard event recorded', {
        roomId,
        participantId,
        type,
        timestamp,
        totalEvents: sessionRef.current?.keyboardEvents.length ?? 0,
      })
    },
    [ensureSession, roomId, participantId],
  )

  const notifyTyping = useCallback(
    (isTyping) => {
      console.log('[debug] notifyTyping', { roomId, participantId, isTyping })

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
    console.log('[debug] cancelTypingSession (send)', { roomId, participantId })
    await endSession()
  }, [endSession, roomId, participantId])

  useEffect(() => {
    function flushOnPageHide() {
      if (sessionRef.current?.keyboardEvents.length) {
        console.log('[debug] pagehide flush', { roomId, participantId })
        void endSessionRef.current?.()
      }
    }

    window.addEventListener('pagehide', flushOnPageHide)
    return () => {
      window.removeEventListener('pagehide', flushOnPageHide)

      if (hideTimer.current) {
        console.log('[debug] cleanup clearing pending timer', { roomId, participantId })
        clearTimeout(hideTimer.current)
        hideTimer.current = null
      }

      if (sessionRef.current?.keyboardEvents.length) {
        console.log('[debug] cleanup flushing session', { roomId, participantId })
        void endSessionRef.current?.()
      }

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
