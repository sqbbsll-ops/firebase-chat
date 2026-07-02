const PAUSE_THRESHOLD_MS = 500

function pushSegment(segments, type, durationMs) {
  const duration = Math.trunc(durationMs)
  if (duration <= 0) return

  const last = segments[segments.length - 1]
  if (last?.type === type) {
    last.durationMs += duration
    return
  }

  segments.push({ type, durationMs: duration })
}

function sumDuration(segments, type) {
  return segments
    .filter((segment) => segment.type === type)
    .reduce((total, segment) => total + segment.durationMs, 0)
}

function maxDuration(segments, type) {
  return segments
    .filter((segment) => segment.type === type)
    .reduce((max, segment) => Math.max(max, segment.durationMs), 0)
}

function countSegments(segments, type) {
  return segments.filter((segment) => segment.type === type).length
}

/**
 * Build realTimeline from keyboard timestamps.
 * Pause = gap without keystrokes for more than 500ms.
 */
export function buildRealTimeline(keyboardEvents, sessionStartTime, sessionEndTime) {
  const timestamps = keyboardEvents
    .map((event) => event.timestamp)
    .sort((a, b) => a - b)

  if (timestamps.length === 0) return []

  const segments = []
  let index = 0

  if (timestamps[0] > sessionStartTime) {
    pushSegment(segments, 'pause', timestamps[0] - sessionStartTime)
  }

  while (index < timestamps.length) {
    const burstStart = timestamps[index]
    let burstEnd = burstStart
    index += 1

    while (
      index < timestamps.length &&
      timestamps[index] - timestamps[index - 1] < PAUSE_THRESHOLD_MS
    ) {
      burstEnd = timestamps[index]
      index += 1
    }

    const typingDuration = burstEnd > burstStart ? burstEnd - burstStart : 1
    pushSegment(segments, 'typing', typingDuration)

    if (index < timestamps.length) {
      pushSegment(segments, 'pause', timestamps[index] - burstEnd)
    }
  }

  const lastKey = timestamps[timestamps.length - 1]
  if (sessionEndTime > lastKey) {
    pushSegment(segments, 'pause', sessionEndTime - lastKey)
  }

  return segments
}

export function buildIndicatorTimeline(indicatorEvents, sessionEndTime) {
  const sorted = [...indicatorEvents].sort((a, b) => a.timestamp - b.timestamp)
  if (sorted.length === 0) return []

  const segments = []

  for (let i = 0; i < sorted.length; i += 1) {
    const current = sorted[i]
    const next = sorted[i + 1]
    const end = next ? next.timestamp : sessionEndTime
    pushSegment(segments, current.state, end - current.timestamp)
  }

  return segments
}

export function buildSessionAnalysis({
  keyboardEvents,
  indicatorEvents,
  sessionStartTime,
  sessionEndTime,
}) {
  const realTimeline = buildRealTimeline(
    keyboardEvents,
    sessionStartTime,
    sessionEndTime,
  )
  const indicatorTimeline = buildIndicatorTimeline(
    indicatorEvents,
    sessionEndTime,
  )

  const typingDuration = sumDuration(realTimeline, 'typing')
  const totalPauseMs = sumDuration(realTimeline, 'pause')
  const indicatorDuration = sumDuration(indicatorTimeline, 'on')
  const totalPresentedPauseMs = sumDuration(indicatorTimeline, 'off')
  const totalMaskedMs = Math.max(0, totalPauseMs - totalPresentedPauseMs)

  return {
    realTimeline,
    indicatorTimeline,
    typingDuration,
    indicatorDuration,
    maxPause: maxDuration(realTimeline, 'pause'),
    pauseCount: countSegments(realTimeline, 'pause'),
    totalPauseMs,
    totalMaskedMs,
  }
}
