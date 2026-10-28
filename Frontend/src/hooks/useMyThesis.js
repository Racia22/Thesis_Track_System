import { useEffect, useState } from 'react'
import apiClient from '../api/client'

/**
 * Loads the signed-in student's thesis. status is 'loading' | 'found' | 'none' (no thesis
 * registered yet, the API's 404) | 'error'.
 */
export default function useMyThesis() {
  const [thesis, setThesisState] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let cancelled = false
    apiClient
      .get('/theses/my')
      .then(({ data }) => {
        if (cancelled) return
        setThesisState(data)
        setStatus('found')
      })
      .catch((err) => {
        if (!cancelled) setStatus(err.response?.status === 404 ? 'none' : 'error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  function setThesis(data) {
    setThesisState(data)
    setStatus('found')
  }

  return { thesis, setThesis, status }
}
