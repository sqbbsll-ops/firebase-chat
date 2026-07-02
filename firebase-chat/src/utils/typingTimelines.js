const PAUSE_THRESHOLD_MS = 500
const MIN_SEGMENT_MS = 50

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

function mergeShortSegments(segments, minMs = MIN_SEGMENT_MS) {
  if (segments.length === 0) return []

  const merged = segments.map((segment) => ({ ...segment }))

  for (let i = 0; i < merged.length; i += 1) {
    if (merged[i].durationMs >= minMs) continue

    if (i > 0) {
      merged[i - 1].durationMs += merged[i].durationMs
      merged.splice(i, 1)
      i -= 1
      continue
    }

    if (merged.length > 1) {
      merged[1].durationMs += merged[0].durationMs
      merged.shift()
      i -= 1
    }
  }

  return merged
}

function consolidateAdjacent(segments) {
  const consolidated = []

  for (const segment of segments) {
    const last = consolidated[consolidated.length - 1]
    if (last?.type === segment.type) {
      last.durationMs += segment.durationMs
    } else {
      consolidated.push({ ...segment })
    }
  }

  return consolidated
}

function finalizeTimeline(segments) {
  return mergeShortSegments(consolidateAdjacent(segments))
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
 * Pause = gap without keystrokes for at least 500ms.
 * Typing = active burst; single-key bursts span until idle threshold (500ms).
 */
export function buildRealTimeline(keyboardEvents, sessionStartTime, sessionEndTime) {
  const timestamps = [...new Set(keyboardEvents.map((event) => event.timestamp))].sort(
    (a, b) => a - b,
  )

  if (timestamps.length === 0) return []

  const segments = []
  let cursor = sessionStartTime
  let index = 0

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

    if (burstStart > cursor) {
      pushSegment(segments, 'pause', burstStart - cursor)
    }

    const nextBurstStart = index < timestamps.length ? timestamps[index] : sessionEndTime
    const typingEnd =
      burstStart === burstEnd
        ? Math.min(burstEnd + PAUSE_THRESHOLD_MS, nextBurstStart, sessionEndTime)
        : burstEnd

    pushSegment(segments, 'typing', typingEnd - burstStart)

    if (burstEnd === burstStart) {
      cursor = typingEnd
    } else {
      cursor = burstEnd
      if (index < timestamps.length) {
        const gap = timestamps[index] - burstEnd
        if (gap >= PAUSE_THRESHOLD_MS) {
          pushSegment(segments, 'pause', gap)
          cursor = timestamps[index]
        }
      }
    }
  }

  if (sessionEndTime > cursor) {
    pushSegment(segments, 'pause', sessionEndTime - cursor)
  }

  return finalizeTimeline(segments)
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

  return finalizeTimeline(segments)
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
