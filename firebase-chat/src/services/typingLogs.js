import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase/config'

function typingLogsRef(roomId) {
  return collection(db, 'rooms', roomId, 'typingLogs')
}

/** Persist a completed typing session (visible to other participants only). */
export async function saveTypingLog(roomId, { typerId, durationMs, anchorMessageId }) {
  return addDoc(typingLogsRef(roomId), {
    typerId,
    durationMs: Math.round(durationMs),
    anchorMessageId,
    createdAt: serverTimestamp(),
  })
}

/** Subscribe to typing session logs for a room. */
export function subscribeTypingLogs(roomId, onLogs, onError) {
  const q = query(typingLogsRef(roomId), orderBy('createdAt', 'desc'))

  return onSnapshot(
    q,
    (snapshot) => {
      const logs = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }))
      onLogs(logs)
    },
    onError,
  )
}
