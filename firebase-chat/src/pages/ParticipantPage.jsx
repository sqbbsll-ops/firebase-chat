import { useParams } from 'react-router-dom'
import ChatPanel from '../components/ChatPanel'
import {
  getParticipantPairing,
  isValidGroupId,
  isValidParticipantId,
} from '../constants'
import styles from './ParticipantPage.module.css'

export default function ParticipantPage() {
  const { id, group } = useParams()
  const participantId = id?.toUpperCase()
  const groupId = group?.toLowerCase()
  const pairing = participantId ? getParticipantPairing(participantId) : null

  if (
    !participantId ||
    !isValidParticipantId(participantId) ||
    !groupId ||
    !isValidGroupId(groupId) ||
    !pairing
  ) {
    return (
      <div className={styles.invalid}>
        <h1>Invalid participant or group</h1>
        <p>Use a link like /participant/A/group1 through /participant/H/group3.</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <h1 className={styles.participantLabel}>
          Participant {participantId} · {groupId}
        </h1>
      </header>

      <div className={styles.dualLayout}>
        <ChatPanel
          participantId={participantId}
          partnerId={pairing.left.partner}
          typingDelayMs={pairing.left.delta}
          groupId={groupId}
        />

        <div className={styles.divider} aria-hidden="true" />

        <ChatPanel
          participantId={participantId}
          partnerId={pairing.right.partner}
          typingDelayMs={pairing.right.delta}
          groupId={groupId}
        />
      </div>
    </div>
  )
}
