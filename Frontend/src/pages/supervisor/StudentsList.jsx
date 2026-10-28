import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../../api/client'

function statusLabel(status) {
  return status
    .toLowerCase()
    .split('_')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ')
}

function ActionLinks({ thesisId }) {
  return (
    <div className="flex gap-2">
      <Link
        to={`/supervisor/messages/${thesisId}`}
        className="rounded-md bg-[#FF6B35] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#e35a28]"
      >
        Message
      </Link>
      <Link
        to={`/supervisor/documents/${thesisId}`}
        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-[#1A1A2E] hover:bg-gray-50"
      >
        Documents
      </Link>
    </div>
  )
}

export default function StudentsList() {
  const [theses, setTheses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get('/theses/supervised').then(({ data }) => {
      setTheses(data)
      setLoading(false)
    })
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-[#1A1A2E]">My Students</h1>

      {loading ? (
        <p className="rounded-2xl bg-white p-6 text-sm text-gray-500 shadow-sm">Loading…</p>
      ) : theses.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-sm text-gray-500 shadow-sm">
          No students have been assigned to you yet.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-4 md:hidden">
            {theses.map((thesis) => (
              <div key={thesis.id} className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="font-medium text-[#1A1A2E]">{thesis.studentName}</p>
                <p className="text-xs text-gray-500">{thesis.studentEmail}</p>
                <p className="mt-2 text-sm text-gray-700">{thesis.title}</p>
                <p className="mt-1 text-xs font-medium text-[#FF6B35]">{statusLabel(thesis.status)}</p>
                <div className="mt-3">
                  <ActionLinks thesisId={thesis.id} />
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-2xl bg-white shadow-sm md:block">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-6 py-3">Student</th>
                  <th className="px-6 py-3">Thesis</th>
                  <th className="px-6 py-3">Stage</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {theses.map((thesis) => (
                  <tr key={thesis.id}>
                    <td className="px-6 py-3">
                      <p className="font-medium text-[#1A1A2E]">{thesis.studentName}</p>
                      <p className="text-xs text-gray-500">{thesis.studentEmail}</p>
                    </td>
                    <td className="px-6 py-3 text-gray-700">{thesis.title}</td>
                    <td className="px-6 py-3 text-gray-700">{statusLabel(thesis.status)}</td>
                    <td className="px-6 py-3">
                      <ActionLinks thesisId={thesis.id} />
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
