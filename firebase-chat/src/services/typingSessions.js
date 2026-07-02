import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'

function typingSessionsRef() {
  return collection(db, 'typingSessions')
}

function toInt(value) {
  return Math.trunc(Number(value))
}

/** Save a completed typing session for experiment analysis. */
export async function saveTypingSession({
  participantId,
  roomId,
  deltaT,
  keyboardEvents,
  indicatorEvents,
  sessionStartTime,
  sessionEndTime,
}) {
  const payload = {
    participantId: String(participantId),
    roomId: String(roomId),
    deltaT: toInt(deltaT),
    keyboardEvents: keyboardEvents.map((event) => ({
      timestamp: toInt(event.timestamp),
      type: String(event.type),
    })),
    indicatorEvents: indicatorEvents.map((event) => ({
      timestamp: toInt(event.timestamp),
      state: String(event.state),
    })),
    sessionStartTime: toInt(sessionStartTime),
    sessionEndTime: toInt(sessionEndTime),
    savedAt: serverTimestamp(),
  }

  const docRef = await addDoc(typingSessionsRef(), payload)
  console.info('[typingSessions] saved', docRef.id, {
    participantId: payload.participantId,
    roomId: payload.roomId,
    deltaT: payload.deltaT,
    keyboardEvents: payload.keyboardEvents.length,
    indicatorEvents: payload.indicatorEvents.length,
  })
  return docRef
}
