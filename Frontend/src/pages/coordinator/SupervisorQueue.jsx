import { useEffect, useState } from 'react'
import apiClient from '../../api/client'

function daysLabel(days) {
  return `${days} ${days === 1 ? 'day' : 'days'}`
}

export default function SupervisorQueue() {
  const [queue, setQueue] = useState([])
  const [supervisors, setSupervisors] = useState([])
  const [selected, setSelected] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyThesisId, setBusyThesisId] = useState(null)

  async function loadData() {
    setLoading(true)
    const [queueRes, supervisorsRes] = await Promise.all([
      apiClient.get('/theses/queue/supervisor'),
      apiClient.get('/supervisors'),
    ])
    setQueue(queueRes.data)
    setSupervisors(supervisorsRes.data)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleAssign(thesisId) {
    const supervisorId = selected[thesisId]
    if (!supervisorId) return

    setError('')
    setBusyThesisId(thesisId)
    try {
      await apiClient.post(`/theses/${thesisId}/assign-supervisor`, { supervisorId })
      await loadData()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not assign supervisor')
    } finally {
      setBusyThesisId(null)
    }
  }

  function AssignControl({ thesisId, stacked }) {
    return (
      <div className={stacked ? 'flex flex-col gap-2' : 'flex items-center gap-2'}>
        <select
          value={selected[thesisId] ?? ''}
          onChange={(e) => setSelected((s) => ({ ...s, [thesisId]: e.target.value }))}
          className={[
            'rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35]',
            stacked ? 'w-full' : '',
          ].join(' ')}
        >
          <option value="">Select supervisor…</option>
          {supervisors.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.currentStudentCount} students)
            </option>
          ))}
        </select>
        <button
          onClick={() => handleAssign(thesisId)}
          disabled={!selected[thesisId] || busyThesisId === thesisId}
          className={[
            'rounded-md bg-[#FF6B35] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#e35a28] disabled:opacity-50',
            stacked ? 'w-full' : '',
          ].join(' ')}
        >
          {busyThesisId === thesisId ? 'Assigning…' : 'Assign'}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-[#1A1A2E]">Supervisor Assignment Queue</h1>
      <p className="text-sm text-gray-500">Students waiting for a supervisor, sorted oldest-waiting first.</p>

      {error && <p className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="rounded-2xl bg-white p-6 text-sm text-gray-500 shadow-sm">Loading…</p>
      ) : queue.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-sm text-gray-500 shadow-sm">
          No one is waiting for a supervisor right now.
        </p>
      ) : (
        <>
          {/* Card layout below md — the table's columns don't fit a phone screen, and the
              assign controls are the whole point of this page so they can't be the part
              that scrolls off-screen. */}
          <div className="flex flex-col gap-4 md:hidden">
            {queue.map((thesis) => (
              <div key={thesis.id} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-[#1A1A2E]">{thesis.studentName}</p>
                    <p className="text-xs text-gray-500">{thesis.studentEmail}</p>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-[#FF6B35]">
                    {daysLabel(thesis.daysInCurrentStage)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-700">{thesis.title}</p>
                <div className="mt-3">
                  <AssignControl thesisId={thesis.id} stacked />
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-2xl bg-white shadow-sm md:block">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-6 py-3">Student</th>
                  <th className="px-6 py-3">Thesis</th>
                  <th className="px-6 py-3">Waiting</th>
                  <th className="px-6 py-3">Assign supervisor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {queue.map((thesis) => (
                  <tr key={thesis.id}>
                    <td className="px-6 py-3">
                      <p className="font-medium text-[#1A1A2E]">{thesis.studentName}</p>
                      <p className="text-xs text-gray-500">{thesis.studentEmail}</p>
                    </td>
                    <td className="px-6 py-3 text-gray-700">{thesis.title}</td>
                    <td className="px-6 py-3 font-medium text-[#FF6B35]">{daysLabel(thesis.daysInCurrentStage)}</td>
                    <td className="px-6 py-3">
                      <AssignControl thesisId={thesis.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
