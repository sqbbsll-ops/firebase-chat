import { collection, getDocs, query, where } from 'firebase/firestore'
import { getAllRoomIdsForGroup } from '../constants'
import { db } from '../firebase/config'
import { downloadCsv, rowsToCsv, serializeForCsv } from '../utils/csv'

const TYPING_SESSION_COLUMNS = [
  'id',
  'participantId',
  'roomId',
  'groupId',
  'deltaT',
  'endReason',
  'sessionStartTime',
  'sessionEndTime',
  'typingDuration',
  'indicatorDuration',
  'maxPause',
  'pauseCount',
  'totalPauseMs',
  'totalMaskedMs',
  'keyboardEvents',
  'indicatorEvents',
  'realTimeline',
  'indicatorTimeline',
  'savedAt',
]

const WRITING_LOG_COLUMNS = [
  'id',
  'roomId',
  'userId',
  'groupId',
  'timestamp',
  'key',
  'draft',
  'createdAt',
]

function writingLogsRef(roomId) {
  return collection(db, 'rooms', roomId, 'writingLogs')
}

function mapTypingSessionDoc(docSnap) {
  const data = docSnap.data()

  return {
    id: docSnap.id,
    participantId: data.participantId ?? '',
    roomId: data.roomId ?? '',
    groupId: data.groupId ?? '',
    deltaT: data.deltaT ?? '',
    endReason: data.endReason ?? '',
    sessionStartTime: data.sessionStartTime ?? '',
    sessionEndTime: data.sessionEndTime ?? '',
    typingDuration: data.typingDuration ?? '',
    indicatorDuration: data.indicatorDuration ?? '',
    maxPause: data.maxPause ?? '',
    pauseCount: data.pauseCount ?? '',
    totalPauseMs: data.totalPauseMs ?? '',
    totalMaskedMs: data.totalMaskedMs ?? '',
    keyboardEvents: serializeForCsv(data.keyboardEvents ?? []),
    indicatorEvents: serializeForCsv(data.indicatorEvents ?? []),
    realTimeline: serializeForCsv(data.realTimeline ?? []),
    indicatorTimeline: serializeForCsv(data.indicatorTimeline ?? []),
    savedAt: serializeForCsv(data.savedAt ?? ''),
  }
}

function mapWritingLogDoc(docSnap, roomId) {
  const data = docSnap.data()

  return {
    id: docSnap.id,
    roomId,
    userId: data.userId ?? '',
    groupId: data.groupId ?? '',
    timestamp: data.timestamp ?? '',
    key: data.key ?? '',
    draft: data.draft ?? '',
    createdAt: serializeForCsv(data.createdAt ?? ''),
  }
}

export async function fetchTypingSessionsForGroup(groupId) {
  const sessionsQuery = query(
    collection(db, 'typingSessions'),
    where('groupId', '==', groupId),
  )
  const snapshot = await getDocs(sessionsQuery)

  return snapshot.docs.map(mapTypingSessionDoc)
}

export async function fetchWritingLogsForGroup(groupId) {
  const roomIds = getAllRoomIdsForGroup(groupId)
  const logs = []

  await Promise.all(
    roomIds.map(async (roomId) => {
      const snapshot = await getDocs(writingLogsRef(roomId))
      snapshot.docs.forEach((docSnap) => {
        const row = mapWritingLogDoc(docSnap, roomId)
        if (row.groupId === groupId) {
          logs.push(row)
        }
      })
    }),
  )

  logs.sort((a, b) => {
    if (a.timestamp !== b.timestamp) {
      return a.timestamp - b.timestamp
    }

    return a.roomId.localeCompare(b.roomId)
  })

  return logs
}

export async function exportTypingSessionsCsv(groupId) {
  const rows = await fetchTypingSessionsForGroup(groupId)
  const csv = rowsToCsv(rows, TYPING_SESSION_COLUMNS)
  downloadCsv(`typingSessions_${groupId}.csv`, csv)
  return rows.length
}

export async function exportWritingLogsCsv(groupId) {
  const rows = await fetchWritingLogsForGroup(groupId)
  const csv = rowsToCsv(rows, WRITING_LOG_COLUMNS)
  downloadCsv(`writingLogs_${groupId}.csv`, csv)
  return rows.length
}
