import { useState } from 'react'
import { buildRoomId } from '../constants'
import { useMessages } from '../hooks/useMessages'
import { useTyping } from '../hooks/useTyping'
import { useReadReceipts } from '../hooks/useReadReceipts'
import { sendMessage } from '../services/messages'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import styles from './ChatPanel.module.css'

export default function ChatPanel({
  participantId,
  partnerId,
  typingDelayMs,
}) {
  const roomId = buildRoomId(participantId, partnerId)
  const { messages, loading, error } = useMessages(roomId)
  const { typingUsers, notifyTyping, recordKeyboardEvent, cancelTypingSession } =
    useTyping(roomId, participantId, typingDelayMs)
  const [sending, setSending] = useState(false)

  useReadReceipts(roomId, participantId, messages)

  async function handleSend(text) {
    await cancelTypingSession()
    setSending(true)
    try {
      await sendMessage(roomId, {
        text,
        senderId: participantId,
        senderName: participantId,
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <h2 className={styles.title}>Chat with {partnerId}</h2>
        <span className={styles.badge}>Room {roomId}</span>
      </header>

      {error && (
        <div className={styles.errorBanner}>
          Could not load messages: {error.message}
        </div>
      )}

      <main className={styles.main}>
        <MessageList
          messages={messages}
          currentUserId={participantId}
          loading={loading}
          typingUsers={typingUsers}
        />
        <MessageInput
          onSend={handleSend}
          onTypingChange={notifyTyping}
          onKeyboardEvent={recordKeyboardEvent}
          disabled={sending}
        />
      </main>
    </section>
  )
}
