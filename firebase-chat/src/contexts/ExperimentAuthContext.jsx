import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import { auth } from '../firebase/config'

const ExperimentAuthContext = createContext(null)

/** Silent anonymous auth so Firebase rules stay satisfied without a login UI. */
export function ExperimentAuthProvider({ children }) {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function ensureAuth() {
      try {
        if (!auth.currentUser) {
          await signInAnonymously(auth)
        }
      } catch (err) {
        if (!cancelled) setError(err)
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setReady(true)
        setError(null)
      } else {
        setReady(false)
        ensureAuth()
      }
    })

    ensureAuth()

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  const value = useMemo(() => ({ ready, error }), [ready, error])

  return (
    <ExperimentAuthContext.Provider value={value}>
      {children}
    </ExperimentAuthContext.Provider>
  )
}

export function useExperimentAuth() {
  const context = useContext(ExperimentAuthContext)
  if (!context) {
    throw new Error('useExperimentAuth must be used within ExperimentAuthProvider')
  }
  return context
}
