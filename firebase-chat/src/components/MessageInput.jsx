import { useState } from 'react'
import styles from './MessageInput.module.css'

export default function MessageInput({
  onSend,
  onTypingChange,
  onKeyboardEvent,
  disabled,
}) {
  const [text, setText] = useState('')

  function handleChange(e) {
    const value = e.target.value
    const previousLength = text.length

    if (value.length !== previousLength) {
      const type = value.length > previousLength ? 'input' : 'delete'
      console.log('[debug] MessageInput change', { type, valueLength: value.length })
      onKeyboardEvent?.(type)
    }

    setText(value)
    onTypingChange?.(value.length > 0)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || disabled) return

    setText('')
    await onSend(trimmed)
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        type="text"
        className={styles.input}
        value={text}
        onChange={handleChange}
        placeholder="Type a message…"
        disabled={disabled}
        autoComplete="off"
      />
      <button
        type="submit"
        className={styles.send}
        disabled={disabled || !text.trim()}
        aria-label="Send"
      >
        Send
      </button>
    </form>
  )
}
