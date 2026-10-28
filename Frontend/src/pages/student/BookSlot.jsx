import { useEffect, useState } from 'react'
import { CalendarCheck2, CalendarX2, Clock, MapPin, Users } from 'lucide-react'
import apiClient from '../../api/client'
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  LoadingState,
  PageHeader,
} from '../../components/ui'
import { cx } from '../../lib/cx'
import { apiError, dateParts, formatDate, formatTime } from '../../lib/format'

function DateBlock({ date, highlighted }) {
  const { month, day, weekday } = dateParts(date)
  return (
    <div
      className={cx(
        'flex w-14 shrink-0 flex-col items-center rounded-lg border py-1.5',
        highlighted ? 'border-brand-200 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-700',
      )}
    >
      <span className="text-[11px] font-semibold tracking-wide uppercase">{month}</span>
      <span className="text-xl leading-6 font-semibold">{day}</span>
      <span className="text-[11px] text-slate-500">{weekday}</span>
    </div>
  )
}

export default function BookSlot() {
  const [slots, setSlots] = useState([])
  const [myBookings, setMyBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [busyId, setBusyId] = useState(null)

  async function loadData() {
    try {
      const [slotsRes, bookingsRes] = await Promise.all([
        apiClient.get('/slots'),
        apiClient.get('/bookings/my').catch((err) => (err.response?.status === 404 ? { data: [] } : Promise.reject(err))),
      ])
      setSlots(slotsRes.data)
      setMyBookings(bookingsRes.data)
      setLoadError('')
    } catch (err) {
      setLoadError(apiError(err, 'Could not load review slots'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const activeBooking = myBookings.find((b) => b.status === 'BOOKED')

  async function runAction(id, request, fallback) {
    setActionError('')
    setBusyId(id)
    try {
      await request()
      await loadData()
    } catch (err) {
      setActionError(apiError(err, fallback))
    } finally {
      setBusyId(null)
    }
  }

  const handleBook = (slotId) =>
    runAction(slotId, () => apiClient.post('/bookings', { slotId }), 'Could not book this slot')

  const handleCancel = (bookingId) =>
    runAction(bookingId, () => apiClient.put(`/bookings/${bookingId}/cancel`), 'Could not cancel this booking')

  if (loading) return <LoadingState label="Loading review slots…" />

  return (
    <>
      <PageHeader
        title="Prototype review"
        description="Reserve a slot to present your prototype to the review panel. You can hold one booking at a time."
      />

      <div className="space-y-6">
        {loadError && <Alert>{loadError}</Alert>}
        {actionError && <Alert>{actionError}</Alert>}

        {activeBooking && (
          <Card className="overflow-hidden border-brand-200">
            <div className="flex flex-col gap-4 bg-gradient-to-r from-brand-50 to-white p-5 sm:flex-row sm:items-center">
              <DateBlock date={activeBooking.slot.slotDate} highlighted />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">Your upcoming review</p>
                  <Badge tone="brand" dot>
                    Booked
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {formatDate(activeBooking.slot.slotDate)} · {formatTime(activeBooking.slot.startTime)}–
                  {formatTime(activeBooking.slot.endTime)}
                  {activeBooking.slot.location && ` · ${activeBooking.slot.location}`}
                </p>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleCancel(activeBooking.id)}
                loading={busyId === activeBooking.id}
              >
                Cancel booking
              </Button>
            </div>
          </Card>
        )}

        <Card>
          <CardHeader
            title="Available slots"
            description={slots.length > 0 ? `${slots.length} upcoming ${slots.length === 1 ? 'slot' : 'slots'}` : undefined}
          />
          {slots.length === 0 ? (
            <EmptyState
              icon={CalendarX2}
              title="No open slots right now"
              description="The coordinator hasn't published any upcoming review slots yet. Check back soon."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {slots.map((slot) => {
                const full = slot.spotsAvailable === 0
                const isMine = activeBooking?.slot.id === slot.id
                return (
                  <li key={slot.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center">
                    <DateBlock date={slot.slotDate} highlighted={isMine} />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        {slot.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {slot.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {slot.spotsAvailable} of {slot.capacity} {slot.capacity === 1 ? 'spot' : 'spots'} left
                        </span>
                      </div>
                      {slot.notes && <p className="text-xs text-slate-500">{slot.notes}</p>}
                    </div>
                    {isMine ? (
                      <Badge tone="brand" className="self-start sm:self-auto">
                        <CalendarCheck2 className="h-3.5 w-3.5" /> Your booking
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant={full ? 'secondary' : 'primary'}
                        onClick={() => handleBook(slot.id)}
                        disabled={Boolean(activeBooking) || full}
                        loading={busyId === slot.id}
                        className="self-start sm:self-auto"
                        title={activeBooking ? 'Cancel your current booking to choose another slot' : undefined}
                      >
                        {full ? 'Full' : 'Book slot'}
                      </Button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  )
}
