import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CalendarPlus,
  Clock,
  FileText,
  Flag,
  MessageSquare,
  UserRound,
} from 'lucide-react'
import apiClient from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import ProgressTracker from '../../components/ProgressTracker'
import useMyThesis from '../../hooks/useMyThesis'
import {
  Alert,
  Avatar,
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
  LoadingState,
  PageHeader,
  StageBadge,
  StatCard,
  Textarea,
} from '../../components/ui'
import { apiError, daysLabel, firstName, formatLongDate, stageInfo } from '../../lib/format'

const QUICK_ACTIONS = [
  { to: '/student/book-slot', label: 'Prototype review', description: 'Reserve a review slot', icon: CalendarPlus },
  { to: '/student/documents', label: 'Documents', description: 'Upload and manage drafts', icon: FileText },
  { to: '/student/messages', label: 'Messages', description: 'Talk to your supervisor', icon: MessageSquare },
  { to: '/notifications', label: 'Notifications', description: 'Your recent updates', icon: Bell },
]

const NEXT_STEP = {
  REGISTERED: { text: 'Book a prototype review slot to move your thesis forward.', to: '/student/book-slot', cta: 'Book a slot' },
  PROTOTYPE_PENDING: { text: 'Your prototype review is booked. Prepare your demo and slides.', to: '/student/book-slot', cta: 'View booking' },
  PROTOTYPE_REVIEWED: { text: 'Your prototype has been reviewed. The coordinator will assign a supervisor soon.' },
  SUPERVISOR_ASSIGNED: { text: 'Introduce yourself to your supervisor and agree on a schedule.', to: '/student/messages', cta: 'Send a message' },
  IN_PROGRESS: { text: 'Keep sharing drafts with your supervisor as you write.', to: '/student/documents', cta: 'Upload a draft' },
  READY_FOR_DEFENSE: { text: 'You are ready for defense. Make sure your final version is uploaded.', to: '/student/documents', cta: 'Check documents' },
  COMPLETED: { text: 'Congratulations — your thesis is complete.' },
}

function RegisterThesisForm({ onRegistered }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const { data } = await apiClient.post('/theses', { title, description })
      onRegistered(data)
    } catch (err) {
      setError(apiError(err, 'Could not register your thesis'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader
        title="Register your thesis"
        description="Tell us what you're working on. You can start booking reviews right after."
      />
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <Alert>{error}</Alert>}
          <Field label="Thesis title" htmlFor="title">
            <Input id="title" required maxLength={500} value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Short description" htmlFor="description" optional hint="A few sentences on the problem and your approach.">
            <Textarea id="description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" loading={submitting}>
              Register thesis
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const { thesis, setThesis, status } = useMyThesis()

  if (status === 'loading') return <LoadingState label="Loading your dashboard…" />
  if (status === 'error') return <Alert>Something went wrong loading your thesis. Please refresh the page.</Alert>

  if (status === 'none') {
    return (
      <>
        <PageHeader title={`Welcome, ${firstName(user?.name)}`} description="Let's get your thesis set up." />
        <RegisterThesisForm onRegistered={setThesis} />
      </>
    )
  }

  const nextStep = NEXT_STEP[thesis.status]

  return (
    <>
      <PageHeader
        title={`Welcome back, ${firstName(user?.name)}`}
        description="Here's where your thesis stands today."
      />

      <div className="space-y-6">
        <Card>
          <CardBody className="flex flex-col gap-4 py-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">Your thesis</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">{thesis.title}</h2>
              {thesis.description && <p className="mt-1 max-w-3xl text-sm text-slate-600">{thesis.description}</p>}
            </div>
            <div className="shrink-0 self-start">
              <StageBadge status={thesis.status} />
            </div>
          </CardBody>
          {nextStep && (
            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-sm text-slate-700">
                <Flag className="h-4 w-4 shrink-0 text-brand-600" />
                {nextStep.text}
              </p>
              {nextStep.to && (
                <Button to={nextStep.to} size="sm" variant="secondary">
                  {nextStep.cta}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          )}
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Current stage" value={stageInfo(thesis.status).short} icon={Flag} />
          <StatCard
            label="Time in stage"
            value={daysLabel(thesis.daysInCurrentStage)}
            hint={thesis.stageEnteredAt && `Since ${formatLongDate(thesis.stageEnteredAt)}`}
            icon={Clock}
            tone="amber"
          />
          <StatCard
            label="Registered"
            value={formatLongDate(thesis.registeredAt)}
            icon={CalendarDays}
            tone="violet"
          />
        </div>

        <ProgressTracker status={thesis.status} daysInCurrentStage={thesis.daysInCurrentStage} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader title="Supervisor" />
            <CardBody>
              {thesis.supervisorName ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={thesis.supervisorName} size="lg" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{thesis.supervisorName}</p>
                      <a href={`mailto:${thesis.supervisorEmail}`} className="truncate text-sm text-brand-600 hover:underline">
                        {thesis.supervisorEmail}
                      </a>
                    </div>
                  </div>
                  <Button to="/student/messages" variant="secondary" size="sm" icon={MessageSquare} className="w-full">
                    Message supervisor
                  </Button>
                </div>
              ) : (
                <div className="flex items-start gap-3 text-sm text-slate-500">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
                    <UserRound className="h-5 w-5 text-slate-400" />
                  </span>
                  <p>Not assigned yet. A coordinator assigns supervisors after your prototype review.</p>
                </div>
              )}
            </CardBody>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader title="Quick actions" />
            <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-y-0">
              {QUICK_ACTIONS.map((action, i) => (
                <Link
                  key={action.to}
                  to={action.to}
                  className={[
                    'group flex items-center gap-3 px-5 py-4 transition-colors hover:bg-slate-50',
                    i < 2 ? 'sm:border-b sm:border-slate-100' : '',
                    i % 2 === 0 ? 'sm:border-r sm:border-slate-100' : '',
                  ].join(' ')}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <action.icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-slate-900">{action.label}</span>
                    <span className="block text-xs text-slate-500">{action.description}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" />
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
