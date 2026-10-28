import { useEffect, useState } from 'react'
import apiClient from '../api/client'

/** Finds one of the signed-in supervisor's theses by id (null while loading or if not theirs). */
export default function useSupervisedThesis(thesisId) {
  const [thesis, setThesis] = useState(null)

  useEffect(() => {
    let cancelled = false
    apiClient
      .get('/theses/supervised')
      .then(({ data }) => {
        if (!cancelled) setThesis(data.find((t) => t.id === thesisId) ?? null)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [thesisId])

  return thesis
}
