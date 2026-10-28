import { useEffect, useState } from 'react'
import { CalendarClock, CalendarPlus, MapPin, Trash2 } from 'lucide-react'
import apiClient from '../../api/client'
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Field,
  Input,
  LoadingState,
  PageHeader,
  StatCard,
  Table,
} from '../../components/ui'
import { cx } from '../../lib/cx'
import { apiError, dateParts, formatTime } from '../../lib/format'

const emptyForm = { slotDate: '', startTime: '', endTime: '', capacity: 1, location: '', notes: '' }

function CapacityBar({ booked, capacity }) {
  const percent = capacity > 0 ? Math.min((booked / capacity) * 100, 100) : 0
  const full = booked >= capacity
  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
        <div className={cx('h-full rounded-full', full ? 'bg-amber-500' : 'bg-brand-600')} style={{ width: `${percent}%` }} />
      </div>
      <span className="text-sm whitespace-nowrap text-slate-600 tabular-nums">
        {booked}/{capacity}
      </span>
    </div>
  )
}

export default function SlotsManagement() {
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [listError, setListError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [created, setCreated] = useState(false)
  const [busySlotId, setBusySlotId] = useState(null)

  async function loadSlots() {
    try {
      const { data } = await apiClient.get('/slots')
      setSlots(data)
    } catch (err) {
      setListError(apiError(err, 'Could not load slots'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSlots()
  }, [])

  function updateField(field) {
    return (e) => {
      setCreated(false)
      setForm((f) => ({ ...f, [field]: e.target.value }))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    setFieldErrors({})
    setCreated(false)
    setSubmitting(true)
    try {
      await apiClient.post('/slots', {
        ...form,
        capacity: Number(form.capacity),
        startTime: `${form.startTime}:00`,
        endTime: `${form.endTime}:00`,
      })
      setForm(emptyForm)
      setCreated(true)
      await loadSlots()
    } catch (err) {
      setFormError(apiError(err, 'Could not create slot'))
      setFieldErrors(err.response?.data?.fieldErrors || {})
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCancel(slotId) {
    setListError('')
    setBusySlotId(slotId)
    try {
      await apiClient.delete(`/slots/${slotId}`)
      await loadSlots()
    } catch (err) {
      setListError(apiError(err, 'Could not cancel this slot'))
    } finally {
      setBusySlotId(null)
    }
  }

  const totalCapacity = slots.reduce((sum, s) => sum + s.capacity, 0)
  const totalBooked = slots.reduce((sum, s) => sum + s.bookedCount, 0)

  return (
    <>
      <PageHeader
        title="Review slots"
        description="Publish prototype review sessions for students to book."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Upcoming slots" value={loading ? '—' : slots.length} icon={CalendarClock} />
        <StatCard label="Seats booked" value={loading ? '—' : `${totalBooked} / ${totalCapacity}`} icon={CalendarPlus} tone="violet" />
        <StatCard
          label="Seats open"
          value={loading ? '—' : totalCapacity - totalBooked}
          hint="Across all upcoming slots"
          icon={CalendarClock}
          tone="green"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1 xl:self-start">
          <CardHeader title="New slot" description="Students are notified when they book." />
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && <Alert>{formError}</Alert>}
              {created && <Alert tone="success">Slot published.</Alert>}

              <Field label="Date" htmlFor="slotDate" error={fieldErrors.slotDate}>
                <Input id="slotDate" type="date" required value={form.slotDate} onChange={updateField('slotDate')} invalid={!!fieldErrors.slotDate} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start" htmlFor="startTime" error={fieldErrors.startTime}>
                  <Input id="startTime" type="time" required value={form.startTime} onChange={updateField('startTime')} />
                </Field>
                <Field label="End" htmlFor="endTime" error={fieldErrors.endTime}>
                  <Input id="endTime" type="time" required value={form.endTime} onChange={updateField('endTime')} />
                </Field>
              </div>
              <Field label="Capacity" htmlFor="capacity" error={fieldErrors.capacity} hint="Number of students per session.">
                <Input id="capacity" type="number" min={1} required value={form.capacity} onChange={updateField('capacity')} />
              </Field>
              <Field label="Location" htmlFor="location" optional>
                <Input id="location" placeholder="e.g. Room B12" value={form.location} onChange={updateField('location')} />
              </Field>
              <Field label="Notes" htmlFor="notes" optional>
                <Input id="notes" placeholder="e.g. Bring your laptop" value={form.notes} onChange={updateField('notes')} />
              </Field>

              <Button type="submit" loading={submitting} icon={CalendarPlus} className="w-full">
                Publish slot
              </Button>
            </form>
          </CardBody>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader title="Upcoming slots" />
          {listError && <Alert className="mx-5 mt-4">{listError}</Alert>}
          {loading ? (
            <LoadingState />
          ) : slots.length === 0 ? (
            <EmptyState icon={CalendarClock} title="No upcoming slots" description="Publish a slot to let students book their prototype review." />
          ) : (
            <Table
              minWidth={560}
              columns={[
                { label: 'Date' },
                { label: 'Time' },
                { label: 'Location' },
                { label: 'Booked' },
                { label: <span className="sr-only">Actions</span>, key: 'actions', align: 'right' },
              ]}
            >
              {slots.map((slot) => {
                const { month, day, weekday } = dateParts(slot.slotDate)
                return (
                  <tr key={slot.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <p className="font-medium whitespace-nowrap text-slate-900">
                        {month} {day}
                      </p>
                      <p className="text-xs text-slate-500">{weekday}</p>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-slate-700 tabular-nums">
                      {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      {slot.location ? (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          {slot.location}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <CapacityBar booked={slot.bookedCount} capacity={slot.capacity} />
                        {slot.bookedCount >= slot.capacity && <Badge tone="amber">Full</Badge>}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        onClick={() => handleCancel(slot.id)}
                        loading={busySlotId === slot.id}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        Cancel
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </Table>
          )}
        </Card>
      </div>
    </>
  )
}
