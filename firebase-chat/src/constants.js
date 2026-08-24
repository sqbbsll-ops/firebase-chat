/** Hard-coded pairing table for the academic experiment. */
export const PARTICIPANT_PAIRINGS = {
  A: {
    left: { partner: 'C', delta: 1000 },
    right: { partner: 'D', delta: 24000 },
  },
  B: {
    left: { partner: 'D', delta: 1000 },
    right: { partner: 'G', delta: 24000 },
  },
  C: {
    left: { partner: 'A', delta: 1000 },
    right: { partner: 'F', delta: 24000 },
  },
  D: {
    left: { partner: 'B', delta: 1000 },
    right: { partner: 'A', delta: 24000 },
  },
  E: {
    left: { partner: 'G', delta: 1000 },
    right: { partner: 'H', delta: 24000 },
  },
  F: {
    left: { partner: 'H', delta: 1000 },
    right: { partner: 'C', delta: 24000 },
  },
  G: {
    left: { partner: 'E', delta: 1000 },
    right: { partner: 'B', delta: 24000 },
  },
  H: {
    left: { partner: 'F', delta: 1000 },
    right: { partner: 'E', delta: 24000 },
  },
}

/** Minimal pairing for group4: only A, C, D with AC (1s) and AD (24s) rooms. */
export const GROUP4_PAIRINGS = {
  A: {
    left: { partner: 'C', delta: 1000 },
    right: { partner: 'D', delta: 24000 },
  },
  C: {
    left: { partner: 'A', delta: 1000 },
    right: null,
  },
  D: {
    left: null,
    right: { partner: 'A', delta: 24000 },
  },
}

export const GROUP4_PARTICIPANT_IDS = ['A', 'C', 'D']

export const GROUP4_ROOM_IDS = ['AC', 'AD']

export const VALID_PARTICIPANT_IDS = Object.keys(PARTICIPANT_PAIRINGS)

export const VALID_GROUP_IDS = ['group1', 'group2', 'group3', 'group4']

/** Build a room id from two participant ids and experiment group (smaller letter first). */
export function buildRoomId(participantA, participantB, groupId) {
  const baseRoomId = [participantA, participantB].sort().join('')
  return `${baseRoomId}_${groupId}`
}

export function getParticipantPairing(participantId, groupId) {
  if (groupId === 'group4') {
    return GROUP4_PAIRINGS[participantId] ?? null
  }

  return PARTICIPANT_PAIRINGS[participantId] ?? null
}

export function isValidParticipantId(participantId, groupId) {
  if (groupId === 'group4') {
    return GROUP4_PARTICIPANT_IDS.includes(participantId)
  }

  return VALID_PARTICIPANT_IDS.includes(participantId)
}

export function isValidGroupId(groupId) {
  return VALID_GROUP_IDS.includes(groupId)
}

/** All room ids used in the experiment for a given group. */
export function getAllRoomIdsForGroup(groupId) {
  if (groupId === 'group4') {
    return GROUP4_ROOM_IDS.map((baseRoomId) => `${baseRoomId}_${groupId}`)
  }

  const roomIds = new Set()

  for (const participantId of VALID_PARTICIPANT_IDS) {
    const pairing = PARTICIPANT_PAIRINGS[participantId]
    roomIds.add(buildRoomId(participantId, pairing.left.partner, groupId))
    roomIds.add(buildRoomId(participantId, pairing.right.partner, groupId))
  }

  return [...roomIds]
}
