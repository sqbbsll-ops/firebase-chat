import { useCallback, useEffect, useRef, useState } from 'react'
import { setTyping, subscribeTyping } from '../services/typing'
import { saveTypingSession } from '../services/typingSessions'
import { buildSessionAnalysis } from '../utils/typingTimelines'

const SESSION_IDLE_TIMEOUT_MS = 10_000

function createEmptySession(startTime) {
  return {
    keyboardEvents: [],
    indicatorEvents: [],
    sessionStartTime: startTime,
  }
}

function clearTimerRef(timerRef) {
  if (timerRef.current) {
    clearTimeout(timerRef.current)
    timerRef.current = null
  }
}

export function useTyping(roomId, participantId, typingDelayMs) {
  const [typingUsers, setTypingUsers] = useState([])
  const hideIndicatorTimerRef = useRef(null)
  const idleSessionTimerRef = useRef(null)
  const clearedSessionTimerRef = useRef(null)
  const sessionRef = useRef(null)
  const indicatorOnRef = useRef(false)
  const endSessionRef = useRef(null)
  const pendingEndReasonRef = useRef('timeout')
  const isPersistingRef = useRef(false)

  useEffect(() => {
    console.log('[typingSessions] useTyping mounted', {
      roomId,
      participantId,
      typingDelayMs,
    })
    if (!roomId || !participantId) return undefined
    return subscribeTyping(roomId, participantId, setTypingUsers)
  }, [roomId, participantId, typingDelayMs])

  const ensureSession = useCallback((startTime = Date.now()) => {
    if (!sessionRef.current) {
      sessionRef.current = createEmptySession(startTime)
      console.log('[typingSessions] session started', {
        roomId,
        participantId,
        sessionStartTime: startTime,
      })
    }
    return sessionRef.current
  }, [roomId, participantId])

  const clearAllTimers = useCallback(() => {
    clearTimerRef(hideIndicatorTimerRef)
    clearTimerRef(idleSessionTimerRef)
    clearTimerRef(clearedSessionTimerRef)
  }, [])

  const persistSession = useCallback(
    async (endReason) => {
      if (isPersistingRef.current) {
        console.log('[typingSessions] persist skipped: already persisting', {
          roomId,
          participantId,
          endReason,
        })
        return
      }

      const session = sessionRef.current
      if (!session) {
        console.log('[typingSessions] persist skipped: no active session', {
          roomId,
          participantId,
          endReason,
        })
        return
      }

      if (session.keyboardEvents.length === 0) {
        console.log('[typingSessions] persist skipped: no keyboard events', {
          roomId,
          participantId,
          endReason,
        })
        sessionRef.current = null
        return
      }

      isPersistingRef.current = true
      sessionRef.current = null

      const sessionEndTime = Date.now()
      const analysis = buildSessionAnalysis({
        keyboardEvents: session.keyboardEvents,
        indicatorEvents: session.indicatorEvents,
        sessionStartTime: session.sessionStartTime,
        sessionEndTime,
      })

      const sessionData = {
        participantId,
        roomId,
        deltaT: typingDelayMs,
        endReason,
        sessionStartTime: session.sessionStartTime,
        sessionEndTime,
        keyboardEvents: session.keyboardEvents,
        indicatorEvents: session.indicatorEvents,
        typingDuration: analysis.typingDuration,
        indicatorDuration: analysis.indicatorDuration,
        maxPause: analysis.maxPause,
        pauseCount: analysis.pauseCount,
        totalPauseMs: analysis.totalPauseMs,
        totalMaskedMs: analysis.totalMaskedMs,
        realTimeline: analysis.realTimeline,
        indicatorTimeline: analysis.indicatorTimeline,
      }

      console.log('[typingSessions] persist starting', sessionData)

      try {
        await saveTypingSession(sessionData)
        console.log('[typingSessions] persist finished successfully', {
          roomId,
          participantId,
          endReason,
        })
      } catch (error) {
        console.error('[typingSessions] persist failed', {
          roomId,
          participantId,
          endReason,
          error,
        })
      } finally {
        isPersistingRef.current = false
      }
    },
    [participantId, roomId, typingDelayMs],
  )

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

  const endSession = useCallback(
    async (endReason) => {
      console.log('[typingSessions] endSession called', {
        roomId,
        participantId,
        endReason,
        keyboardEventCount: sessionRef.current?.keyboardEvents.length ?? 0,
        indicatorEventCount: sessionRef.current?.indicatorEvents.length ?? 0,
      })

      clearAllTimers()

      try {
        await turnIndicatorOff()
      } finally {
        await persistSession(endReason)
      }
    },
    [turnIndicatorOff, persistSession, clearAllTimers, roomId, participantId],
  )

  useEffect(() => {
    endSessionRef.current = endSession
  }, [endSession])

  const scheduleIndicatorHide = useCallback(() => {
    clearTimerRef(hideIndicatorTimerRef)

    hideIndicatorTimerRef.current = setTimeout(() => {
      hideIndicatorTimerRef.current = null
      console.log('[typingSessions] indicator hide timer fired', { roomId, participantId })
      void turnIndicatorOff()
    }, typingDelayMs)
  }, [roomId, participantId, typingDelayMs, turnIndicatorOff])

  const scheduleIdleSessionEnd = useCallback(() => {
    clearTimerRef(idleSessionTimerRef)
    pendingEndReasonRef.current = 'timeout'

    idleSessionTimerRef.current = setTimeout(() => {
      idleSessionTimerRef.current = null
      console.log('[typingSessions] idle session timer fired', { roomId, participantId })
      void endSessionRef.current?.('timeout')
    }, SESSION_IDLE_TIMEOUT_MS)
  }, [roomId, participantId])

  const scheduleClearedSessionEnd = useCallback(() => {
    clearTimerRef(idleSessionTimerRef)
    clearTimerRef(clearedSessionTimerRef)
    pendingEndReasonRef.current = 'cleared'

    console.log('[typingSessions] cleared session timer scheduled', {
      roomId,
      participantId,
      typingDelayMs,
    })

    clearedSessionTimerRef.current = setTimeout(() => {
      clearedSessionTimerRef.current = null
      console.log('[typingSessions] cleared session timer fired', { roomId, participantId })
      void endSessionRef.current?.('cleared')
    }, typingDelayMs)
  }, [roomId, participantId, typingDelayMs])

  const recordKeyboardEvent = useCallback(
    (type) => {
      const timestamp = Date.now()
      ensureSession(timestamp).keyboardEvents.push({ timestamp, type })
      console.log('[typingSessions] keyboard event recorded', {
        roomId,
        participantId,
        type,
        totalKeyboardEvents: sessionRef.current?.keyboardEvents.length ?? 0,
      })

      clearTimerRef(clearedSessionTimerRef)
      void turnIndicatorOn()
      scheduleIndicatorHide()
      scheduleIdleSessionEnd()
    },
    [
      ensureSession,
      roomId,
      participantId,
      scheduleIndicatorHide,
      scheduleIdleSessionEnd,
      turnIndicatorOn,
    ],
  )

  const notifyTyping = useCallback(
    (isTyping) => {
      if (!roomId || !participantId) return

      if (!isTyping) {
        console.log('[typingSessions] input cleared, waiting deltaT to end session', {
          roomId,
          participantId,
          typingDelayMs,
        })
        scheduleIndicatorHide()
        scheduleClearedSessionEnd()
        return
      }

      clearTimerRef(clearedSessionTimerRef)
      void turnIndicatorOn()
    },
    [roomId, participantId, scheduleClearedSessionEnd, scheduleIndicatorHide, turnIndicatorOn, typingDelayMs],
  )

  const cancelTypingSession = useCallback(async () => {
    console.log('[typingSessions] send pressed, ending session', {
      roomId,
      participantId,
    })
    pendingEndReasonRef.current = 'send'
    await endSession('send')
  }, [endSession, roomId, participantId])

  useEffect(() => {
    function flushOnPageHide() {
      if (sessionRef.current?.keyboardEvents.length) {
        console.log('[typingSessions] pagehide flush', { roomId, participantId })
        void endSessionRef.current?.(pendingEndReasonRef.current)
      }
    }

    window.addEventListener('pagehide', flushOnPageHide)
    return () => {
      window.removeEventListener('pagehide', flushOnPageHide)
      clearAllTimers()

      if (sessionRef.current?.keyboardEvents.length && !isPersistingRef.current) {
        console.log('[typingSessions] unmount flush', { roomId, participantId })
        void endSessionRef.current?.(pendingEndReasonRef.current)
      }

      if (indicatorOnRef.current && roomId && participantId) {
        void setTyping(roomId, participantId, participantId, false)
      }
    }
  }, [roomId, participantId, clearAllTimers])

  return {
    typingUsers,
    notifyTyping,
    recordKeyboardEvent,
    cancelTypingSession,
  }
}
