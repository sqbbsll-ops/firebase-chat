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
  const pairing =
    participantId && groupId ? getParticipantPairing(participantId, groupId) : null

  if (
    !participantId ||
    !groupId ||
    !isValidGroupId(groupId) ||
    !isValidParticipantId(participantId, groupId) ||
    !pairing
  ) {
    return (
      <div className={styles.invalid}>
        <h1>Invalid participant or group</h1>
        <p>
          Use /participant/A/group1 through /participant/H/group3, or
          /participant/A/group4 through /participant/D/group4.
        </p>
      </div>
    )
  }

  const hasLeft = Boolean(pairing.left)
  const hasRight = Boolean(pairing.right)
  const layoutClassName =
    hasLeft && hasRight ? styles.dualLayout : styles.singleLayout

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <h1 className={styles.participantLabel}>
          Participant {participantId} · {groupId}
        </h1>
      </header>

      <div className={layoutClassName}>
        {pairing.left ? (
          <ChatPanel
            participantId={participantId}
            partnerId={pairing.left.partner}
            typingDelayMs={pairing.left.delta}
            groupId={groupId}
          />
        ) : null}

        {hasLeft && hasRight ? <div className={styles.divider} aria-hidden="true" /> : null}

        {pairing.right ? (
          <ChatPanel
            participantId={participantId}
            partnerId={pairing.right.partner}
            typingDelayMs={pairing.right.delta}
            groupId={groupId}
          />
        ) : null}
      </div>
    </div>
  )
}
