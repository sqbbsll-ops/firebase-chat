import { useParams } from 'react-router-dom'
import ChatPanel from '../components/ChatPanel'
import { getParticipantPairing, isValidParticipantId } from '../constants'
import styles from './ParticipantPage.module.css'

export default function ParticipantPage() {
  const { id } = useParams()
  const participantId = id?.toUpperCase()
  const pairing = participantId ? getParticipantPairing(participantId) : null

  if (!participantId || !isValidParticipantId(participantId) || !pairing) {
    return (
      <div className={styles.invalid}>
        <h1>Invalid participant</h1>
        <p>Use a link like /participant/A through /participant/F.</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <h1 className={styles.participantLabel}>Participant {participantId}</h1>
      </header>

      <div className={styles.dualLayout}>
        <ChatPanel
          participantId={participantId}
          partnerId={pairing.left.partner}
          typingDelayMs={pairing.left.delta}
          conditionLabel="1s"
        />

        <div className={styles.divider} aria-hidden="true" />

        <ChatPanel
          participantId={participantId}
          partnerId={pairing.right.partner}
          typingDelayMs={pairing.right.delta}
          conditionLabel="24s"
        />
      </div>
    </div>
  )
}
