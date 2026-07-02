import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

function typingSessionsRef() {
  return collection(db, 'typingSessions')
}

function toInt(value) {
  return Math.trunc(Number(value))
}

function normalizeSegment(segment, allowedTypes) {
  const type = String(segment.type)
  return {
    type: allowedTypes.includes(type) ? type : allowedTypes[0],
    durationMs: toInt(segment.durationMs),
  }
}

/** Save a completed typing session for experiment analysis. */
export async function saveTypingSession(sessionData) {
  const {
    participantId,
    roomId,
    deltaT,
    endReason,
    typingDuration,
    indicatorDuration,
    maxPause,
    pauseCount,
    totalPauseMs,
    totalMaskedMs,
    realTimeline,
    indicatorTimeline,
  } = sessionData

  console.log('[typingSessions] preparing write', {
    participantId,
    roomId,
    deltaT,
    endReason,
    authUid: auth.currentUser?.uid ?? null,
  })

  if (!auth.currentUser) {
    const error = new Error('Cannot write typingSessions: user is not authenticated')
    console.error('[typingSessions] write blocked', error.message)
    throw error
  }

  const payload = {
    participantId: String(participantId),
    roomId: String(roomId),
    deltaT: toInt(deltaT),
    endReason: String(endReason),
    typingDuration: toInt(typingDuration),
    indicatorDuration: toInt(indicatorDuration),
    maxPause: toInt(maxPause),
    pauseCount: toInt(pauseCount),
    totalPauseMs: toInt(totalPauseMs),
    totalMaskedMs: toInt(totalMaskedMs),
    realTimeline: realTimeline.map((segment) =>
      normalizeSegment(segment, ['typing', 'pause']),
    ),
    indicatorTimeline: indicatorTimeline.map((segment) =>
      normalizeSegment(segment, ['on', 'off']),
    ),
    savedAt: serverTimestamp(),
  }

  console.log('[typingSessions] calling addDoc...', payload)

  try {
    const docRef = await addDoc(typingSessionsRef(), payload)
    console.log('[typingSessions] write success', {
      docId: docRef.id,
      path: docRef.path,
      participantId: payload.participantId,
      roomId: payload.roomId,
      endReason: payload.endReason,
    })
    return docRef
  } catch (error) {
    console.error('[typingSessions] write failed', {
      code: error?.code,
      message: error?.message,
      participantId: payload.participantId,
      roomId: payload.roomId,
      endReason: payload.endReason,
    })
    throw error
  }
}
