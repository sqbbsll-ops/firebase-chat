import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

function writingLogsRef(roomId) {
  return collection(db, 'rooms', roomId, 'writingLogs')
}

function toInt(value) {
  return Math.trunc(Number(value))
}

/** Log a single key press for writing-process reconstruction. */
export async function logKeyPress(roomId, { userId, key, timestamp }) {
  if (!auth.currentUser) {
    throw new Error('Cannot write writingLogs: user is not authenticated')
  }

  return addDoc(writingLogsRef(roomId), {
    userId: String(userId),
    timestamp: toInt(timestamp),
    key: String(key),
    createdAt: serverTimestamp(),
  })
}

/** Log the input draft snapshot after a keyboard event. */
export async function logDraftSnapshot(roomId, { userId, draft, timestamp }) {
  if (!auth.currentUser) {
    throw new Error('Cannot write writingLogs: user is not authenticated')
  }

  return addDoc(writingLogsRef(roomId), {
    userId: String(userId),
    timestamp: toInt(timestamp),
    draft: String(draft),
    createdAt: serverTimestamp(),
  })
}
