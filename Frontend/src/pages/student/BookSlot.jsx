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

export default function BookSlot() {
  const [slots, setSlots] = useState([])
  const [myBookings, setMyBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionError, setActionError] = useState('')
  const [busySlotId, setBusySlotId] = useState(null)

  async function loadData() {
    setLoading(true)
    const [slotsRes, bookingsRes] = await Promise.all([
      apiClient.get('/slots'),
      apiClient.get('/bookings/my').catch((err) => (err.response?.status === 404 ? { data: [] } : Promise.reject(err))),
    ])
    setSlots(slotsRes.data)
    setMyBookings(bookingsRes.data)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const activeBooking = myBookings.find((b) => b.status === 'BOOKED')

  async function handleBook(slotId) {
    setActionError('')
    setBusySlotId(slotId)
    try {
      await apiClient.post('/bookings', { slotId })
      await loadData()
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not book this slot')
    } finally {
      setBusySlotId(null)
    }
  }

  async function handleCancel(bookingId) {
    setActionError('')
    setBusySlotId(bookingId)
    try {
      await apiClient.put(`/bookings/${bookingId}/cancel`)
      await loadData()
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not cancel this booking')
    } finally {
      setBusySlotId(null)
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Loading available slots…</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-[#1A1A2E]">Book a Prototype Review Slot</h1>

      {actionError && (
        <p className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">{actionError}</p>
      )}

      {activeBooking && (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-[#1A1A2E]">Your upcoming booking</h2>
          <p className="text-sm text-gray-700">
            {formatDate(activeBooking.slot.slotDate)} at {formatTime(activeBooking.slot.startTime)}
            {activeBooking.slot.location && ` — ${activeBooking.slot.location}`}
          </p>
          <button
            onClick={() => handleCancel(activeBooking.id)}
            disabled={busySlotId === activeBooking.id}
            className="mt-3 rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            {busySlotId === activeBooking.id ? 'Cancelling…' : 'Cancel booking'}
          </button>
        </div>
      )}

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-[#1A1A2E]">Available slots</h2>

        {slots.length === 0 && <p className="text-sm text-gray-500">No available slots right now. Check back later.</p>}

        <ul className="flex flex-col divide-y divide-gray-100">
          {slots.map((slot) => (
            <li key={slot.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-[#1A1A2E]">
                  {formatDate(slot.slotDate)} · {formatTime(slot.startTime)}–{formatTime(slot.endTime)}
                </p>
                <p className="text-xs text-gray-500">
                  {slot.location ? `${slot.location} · ` : ''}
                  {slot.spotsAvailable} of {slot.capacity} spots left
                </p>
              </div>
              <button
                onClick={() => handleBook(slot.id)}
                disabled={Boolean(activeBooking) || busySlotId === slot.id}
                className="self-start rounded-md bg-[#FF6B35] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#e35a28] disabled:opacity-50 sm:self-auto"
              >
                {busySlotId === slot.id ? 'Booking…' : 'Book this slot'}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
