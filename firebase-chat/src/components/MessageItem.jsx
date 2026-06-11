import styles from './MessageItem.module.css'

function formatTime(timestamp) {
  if (!timestamp?.toDate) return ''
  return timestamp.toDate().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function DeliveryStatus({ isRead }) {
  return (
    <span
      className={`${styles.status} ${isRead ? styles.statusRead : styles.statusDelivered}`}
      aria-label={isRead ? 'Read' : 'Delivered'}
    >
      <span className={styles.statusDot} aria-hidden="true" />
      {isRead ? 'Read' : 'Delivered'}
    </span>
  )
}

export default function MessageItem({ message, isOwn }) {
  const time = formatTime(message.createdAt)
  const isRead = Boolean(message.readAt)

  return (
    <div
      className={`${styles.message} ${isOwn ? styles.own : styles.other}`}
    >
      {!isOwn && (
        <span className={styles.sender}>{message.senderName}</span>
      )}

      <div className={styles.bubble}>
        <p className={styles.text}>{message.text}</p>
        {time && <time className={styles.time}>{time}</time>}
      </div>

      {isOwn && <DeliveryStatus isRead={isRead} />}
    </div>
  )
}
