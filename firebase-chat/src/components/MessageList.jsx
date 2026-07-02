import { useEffect, useRef } from 'react'
import MessageItem from './MessageItem'
import TypingIndicator from './TypingIndicator'
import styles from './MessageList.module.css'

export default function MessageList({
  messages,
  currentUserId,
  loading,
  typingUsers = [],
}) {
  const bottomRef = useRef(null)
  const hasTyping = typingUsers.length > 0

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingUsers])

  if (loading) {
    return <div className={styles.empty}>Loading messages…</div>
  }

  if (!messages.length && !hasTyping) {
    return (
      <div className={styles.empty}>
        No messages yet. Say hello!
      </div>
    )
  }

  return (
    <div className={styles.list}>
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          isOwn={message.senderId === currentUserId}
        />
      ))}
      <TypingIndicator typingUsers={typingUsers} />
      <div ref={bottomRef} />
    </div>
  )
}
