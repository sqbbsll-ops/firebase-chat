import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'

function typingSessionsRef() {
  return collection(db, 'typingSessions')
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
  return addDoc(typingSessionsRef(), {
    participantId,
    roomId,
    deltaT,
    keyboardEvents,
    indicatorEvents,
    sessionStartTime,
    sessionEndTime,
    savedAt: serverTimestamp(),
  })
}
