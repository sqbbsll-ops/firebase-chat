/** Hard-coded pairing table for the academic experiment. */
export const PARTICIPANT_PAIRINGS = {
  A: {
    left: { partner: 'C', delta: 1000 },
    right: { partner: 'D', delta: 24000 },
  },
  B: {
    left: { partner: 'E', delta: 1000 },
    right: { partner: 'F', delta: 24000 },
  },
  C: {
    left: { partner: 'A', delta: 1000 },
    right: { partner: 'B', delta: 24000 },
  },
  D: {
    left: { partner: 'F', delta: 1000 },
    right: { partner: 'A', delta: 24000 },
  },
  E: {
    left: { partner: 'B', delta: 1000 },
    right: { partner: 'C', delta: 24000 },
  },
  F: {
    left: { partner: 'D', delta: 1000 },
    right: { partner: 'E', delta: 24000 },
  },
}

export const VALID_PARTICIPANT_IDS = Object.keys(PARTICIPANT_PAIRINGS)

/** Build a room id from two participant ids (smaller letter first). */
export function buildRoomId(participantA, participantB) {
  return [participantA, participantB].sort().join('')
}

export function getParticipantPairing(participantId) {
  return PARTICIPANT_PAIRINGS[participantId] ?? null
}

export function isValidParticipantId(participantId) {
  return VALID_PARTICIPANT_IDS.includes(participantId)
}
