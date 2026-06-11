function getTimestampMs(timestamp) {
  if (!timestamp) return 0
  if (typeof timestamp.toMillis === 'function') return timestamp.toMillis()
  if (typeof timestamp.toDate === 'function') return timestamp.toDate().getTime()
  return 0
}

/** Merge messages and typing logs into a single chronological feed. */
export function buildChatTimeline(messages, typingLogs) {
  const items = [
    ...messages.map((message) => ({
      type: 'message',
      id: message.id,
      at: getTimestampMs(message.createdAt),
      data: message,
    })),
    ...typingLogs.map((log) => ({
      type: 'typingLog',
      id: log.id,
      at: getTimestampMs(log.createdAt),
      data: log,
    })),
  ]

  return items.sort((a, b) => a.at - b.at)
}

export function formatTypingDuration(ms) {
  return Math.round(ms).toLocaleString('en-US')
}
