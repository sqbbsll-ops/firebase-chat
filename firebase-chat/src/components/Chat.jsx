import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { DEFAULT_ROOM_ID } from '../constants'
import { useMessages } from '../hooks/useMessages'
import { useTyping } from '../hooks/useTyping'
import { useTypingLogs } from '../hooks/useTypingLogs'
import { useReadReceipts } from '../hooks/useReadReceipts'
import { sendMessage } from '../services/messages'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import styles from './Chat.module.css'

export default function Chat() {
  const { user, signOut } = useAuth()
  const roomId = DEFAULT_ROOM_ID
  const { messages, loading, error } = useMessages(roomId)
  const { typingUsers, notifyTyping, cancelTypingSession } = useTyping(
    roomId,
    user,
    messages,
  )
  const typingLogsByMessageId = useTypingLogs(roomId, user.uid)
  const [sending, setSending] = useState(false)

  useReadReceipts(roomId, user.uid, messages)

  const displayName = user.displayName || user.email

  async function handleSend(text) {
    cancelTypingSession()
    setSending(true)
    try {
      await sendMessage(roomId, {
        text,
        senderId: user.uid,
        senderName: displayName,
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <h1 className={styles.title}>Chat</h1>
        <button type="button" className={styles.logout} onClick={signOut}>
          Log out
        </button>
      </header>

      {error && (
        <div className={styles.errorBanner}>
          Could not load messages: {error.message}
        </div>
      )}

      <main className={styles.main}>
        <MessageList
          messages={messages}
          currentUserId={user.uid}
          loading={loading}
          typingUsers={typingUsers}
          typingLogsByMessageId={typingLogsByMessageId}
        />
        <MessageInput
          onSend={handleSend}
          onTypingChange={notifyTyping}
          disabled={sending}
        />
      </main>
    </div>
  )
}
