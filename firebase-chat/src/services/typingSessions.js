import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'

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
export async function saveTypingSession({
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
}) {
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

  const docRef = await addDoc(typingSessionsRef(), payload)
  console.info('[typingSessions] saved', docRef.id, payload)
  return docRef
}
