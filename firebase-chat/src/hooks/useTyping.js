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

  const turnIndicatorOn = useCallback(async () => {
    if (!roomId || !participantId || indicatorOnRef.current) return

    const timestamp = Date.now()
    indicatorOnRef.current = true
    ensureSession(timestamp).indicatorEvents.push({ timestamp, state: 'on' })
    await setTyping(roomId, participantId, participantId, true, timestamp)
  }, [roomId, participantId, ensureSession])

  const turnIndicatorOff = useCallback(async () => {
    if (!roomId || !participantId || !indicatorOnRef.current) return

    const timestamp = Date.now()
    indicatorOnRef.current = false
    sessionRef.current?.indicatorEvents.push({ timestamp, state: 'off' })
    await setTyping(roomId, participantId, participantId, false)
  }, [roomId, participantId])

  const persistSession = useCallback(async () => {
    const session = sessionRef.current
    sessionRef.current = null

    if (!session || session.keyboardEvents.length === 0) return

    await saveTypingSession({
      participantId,
      roomId,
      deltaT: typingDelayMs,
      keyboardEvents: session.keyboardEvents,
      indicatorEvents: session.indicatorEvents,
      sessionStartTime: session.sessionStartTime,
      sessionEndTime: Date.now(),
    }).catch(console.error)
  }, [participantId, roomId, typingDelayMs])

  const endSession = useCallback(async () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current)
      hideTimer.current = null
    }

    await turnIndicatorOff()
    await persistSession()
  }, [turnIndicatorOff, persistSession])

  const scheduleHideTyping = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current)
    }

    hideTimer.current = setTimeout(() => {
      endSession()
      hideTimer.current = null
    }, typingDelayMs)
  }, [endSession, typingDelayMs])

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

      turnIndicatorOn()
      scheduleHideTyping()
    },
    [roomId, participantId, scheduleHideTyping, turnIndicatorOn],
  )

  const cancelTypingSession = useCallback(async () => {
    await endSession()
  }, [endSession])

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
      if (indicatorOnRef.current && roomId && participantId) {
        setTyping(roomId, participantId, participantId, false)
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
