import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'

function typingSessionsRef() {
  return collection(db, 'typingSessions')
}

function toInt(value) {
  return Math.trunc(Number(value))
}

function normalizeKeyboardEvent(event) {
  return {
    timestamp: toInt(event.timestamp),
    type: event.type === 'delete' ? 'delete' : 'input',
  }
}

function normalizeIndicatorEvent(event) {
  return {
    timestamp: toInt(event.timestamp),
    state: event.state === 'off' ? 'off' : 'on',
  }
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
  sessionStartTime,
  sessionEndTime,
  endReason,
  totalTypingMs,
  totalPauseMs,
  totalMaskedMs,
  raw,
  processed,
}) {
  const payload = {
    participantId: String(participantId),
    roomId: String(roomId),
    deltaT: toInt(deltaT),
    sessionStartTime: toInt(sessionStartTime),
    sessionEndTime: toInt(sessionEndTime),
    endReason: String(endReason),
    totalTypingMs: toInt(totalTypingMs),
    totalPauseMs: toInt(totalPauseMs),
    totalMaskedMs: toInt(totalMaskedMs),
    raw: {
      keyboardEvents: raw.keyboardEvents.map(normalizeKeyboardEvent),
      indicatorEvents: raw.indicatorEvents.map(normalizeIndicatorEvent),
    },
    processed: {
      realTimeline: processed.realTimeline.map((segment) =>
        normalizeSegment(segment, ['typing', 'pause']),
      ),
      indicatorTimeline: processed.indicatorTimeline.map((segment) =>
        normalizeSegment(segment, ['on', 'off']),
      ),
    },
    savedAt: serverTimestamp(),
  }

  const docRef = await addDoc(typingSessionsRef(), payload)
  console.info('[typingSessions] saved', docRef.id, {
    participantId: payload.participantId,
    roomId: payload.roomId,
    endReason: payload.endReason,
    totalTypingMs: payload.totalTypingMs,
    totalPauseMs: payload.totalPauseMs,
    totalMaskedMs: payload.totalMaskedMs,
  })
  return docRef
}
