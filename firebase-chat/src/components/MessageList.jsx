import { useEffect, useMemo, useRef } from 'react'
import MessageItem from './MessageItem'
import TypingIndicator from './TypingIndicator'
import { buildChatTimeline, formatTypingDuration } from '../utils/chatTimeline'
import styles from './MessageList.module.css'

export default function MessageList({
  messages,
  currentUserId,
  loading,
  typingUsers = [],
  typingLogs = [],
}) {
  const bottomRef = useRef(null)
  const hasTyping = typingUsers.length > 0
  const timeline = useMemo(
    () => buildChatTimeline(messages, typingLogs),
    [messages, typingLogs],
  )

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [timeline, typingUsers])

  if (loading) {
    return <div className={styles.empty}>Loading messages…</div>
  }

  if (!timeline.length && !hasTyping) {
    return (
      <div className={styles.empty}>
        No messages yet. Say hello!
      </div>
    )
  }

  return (
    <div className={styles.list}>
      {timeline.map((item) => {
        if (item.type === 'message') {
          return (
            <MessageItem
              key={item.id}
              message={item.data}
              isOwn={item.data.senderId === currentUserId}
            />
          )
        }

        return (
          <p key={item.id} className={styles.systemHint}>
            typed for {formatTypingDuration(item.data.durationMs)}ms
          </p>
        )
      })}
      <TypingIndicator typingUsers={typingUsers} />
      <div ref={bottomRef} />
    </div>
  )
}
