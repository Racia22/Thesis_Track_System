import { useEffect, useState } from 'react'
import apiClient from '../../api/client'

function formatDate(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatTime(timeStr) {
  return timeStr.slice(0, 5)
}

const emptyForm = { slotDate: '', startTime: '', endTime: '', capacity: 1, location: '', notes: '' }

export default function SlotsManagement() {
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [busySlotId, setBusySlotId] = useState(null)

  async function loadSlots() {
    setLoading(true)
    const { data } = await apiClient.get('/slots')
    setSlots(data)
    setLoading(false)
  }

  useEffect(() => {
    loadSlots()
  }, [])

  function updateField(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setSubmitting(true)
    try {
      await apiClient.post('/slots', {
        ...form,
        capacity: Number(form.capacity),
        startTime: `${form.startTime}:00`,
        endTime: `${form.endTime}:00`,
      })
      setForm(emptyForm)
      await loadSlots()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create slot')
      setFieldErrors(err.response?.data?.fieldErrors || {})
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCancel(slotId) {
    setError('')
    setBusySlotId(slotId)
    try {
      await apiClient.delete(`/slots/${slotId}`)
      await loadSlots()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not cancel this slot')
    } finally {
      setBusySlotId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-[#1A1A2E]">Manage Review Slots</h1>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-[#1A1A2E]">Create a new slot</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#1A1A2E]">Date</label>
            <input
              type="date"
              required
              value={form.slotDate}
              onChange={updateField('slotDate')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35]"
            />
            {fieldErrors.slotDate && <p className="mt-1 text-xs text-red-600">{fieldErrors.slotDate}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#1A1A2E]">Start time</label>
            <input
              type="time"
              required
              value={form.startTime}
              onChange={updateField('startTime')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#1A1A2E]">End time</label>
            <input
              type="time"
              required
              value={form.endTime}
              onChange={updateField('endTime')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#1A1A2E]">Capacity</label>
            <input
              type="number"
              min={1}
              required
              value={form.capacity}
              onChange={updateField('capacity')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#1A1A2E]">Location (optional)</label>
            <input
              value={form.location}
              onChange={updateField('location')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#1A1A2E]">Notes (optional)</label>
            <input
              value={form.notes}
              onChange={updateField('notes')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35]"
            />
          </div>

          {error && <p className="text-sm text-red-600 sm:col-span-2 lg:col-span-3">{error}</p>}

          <div className="sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-[#FF6B35] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e35a28] disabled:opacity-60"
            >
              {submitting ? 'Creating…' : 'Create slot'}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-[#1A1A2E]">Upcoming slots</h2>

        {loading && <p className="text-sm text-gray-500">Loading…</p>}
        {!loading && slots.length === 0 && <p className="text-sm text-gray-500">No upcoming slots yet.</p>}

        <ul className="flex flex-col divide-y divide-gray-100">
          {slots.map((slot) => (
            <li key={slot.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-[#1A1A2E]">
                  {formatDate(slot.slotDate)} · {formatTime(slot.startTime)}–{formatTime(slot.endTime)}
                </p>
                <p className="text-xs text-gray-500">
                  {slot.location ? `${slot.location} · ` : ''}
                  {slot.bookedCount}/{slot.capacity} booked
                </p>
              </div>
              <button
                onClick={() => handleCancel(slot.id)}
                disabled={busySlotId === slot.id}
                className="self-start rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 sm:self-auto"
              >
                {busySlotId === slot.id ? 'Cancelling…' : 'Cancel slot'}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
