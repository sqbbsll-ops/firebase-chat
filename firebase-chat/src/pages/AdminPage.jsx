import { useState } from 'react'
import { VALID_GROUP_IDS } from '../constants'
import { exportTypingSessionsCsv, exportWritingLogsCsv } from '../services/adminExport'
import styles from './AdminPage.module.css'

export default function AdminPage() {
  const [groupId, setGroupId] = useState(VALID_GROUP_IDS[0])
  const [busyAction, setBusyAction] = useState(null)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  async function handleExport(exportType) {
    setBusyAction(exportType)
    setStatus('')
    setError('')

    try {
      const rowCount =
        exportType === 'typingSessions'
          ? await exportTypingSessionsCsv(groupId)
          : await exportWritingLogsCsv(groupId)

      const label = exportType === 'typingSessions' ? 'typingSessions' : 'writingLogs'
      setStatus(`Exported ${rowCount} ${label} rows for ${groupId}.`)
    } catch (err) {
      setError(err?.message ?? 'Export failed.')
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Admin Export</h1>
        <p className={styles.subtitle}>Download experiment data by group as CSV files.</p>
      </header>

      <main className={styles.main}>
        <label className={styles.field}>
          <span className={styles.label}>Group</span>
          <select
            className={styles.select}
            value={groupId}
            onChange={(event) => setGroupId(event.target.value)}
            disabled={Boolean(busyAction)}
          >
            {VALID_GROUP_IDS.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </label>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.button}
            disabled={Boolean(busyAction)}
            onClick={() => handleExport('typingSessions')}
          >
            {busyAction === 'typingSessions' ? 'Exporting…' : 'Export typingSessions'}
          </button>

          <button
            type="button"
            className={styles.button}
            disabled={Boolean(busyAction)}
            onClick={() => handleExport('writingLogs')}
          >
            {busyAction === 'writingLogs' ? 'Exporting…' : 'Export writingLogs'}
          </button>
        </div>

        {status ? <p className={styles.status}>{status}</p> : null}
        {error ? <p className={styles.error}>{error}</p> : null}
      </main>
    </div>
  )
}
