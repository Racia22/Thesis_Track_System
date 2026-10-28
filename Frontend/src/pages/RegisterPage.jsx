import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpenCheck, GraduationCap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../layouts/AuthLayout'
import { Alert, Button, Field, Input } from '../components/ui'
import { cx } from '../lib/cx'
import { apiError } from '../lib/format'

const ROLE_OPTIONS = [
  { value: 'STUDENT', label: 'Student', description: 'Writing a thesis', icon: GraduationCap },
  { value: 'SUPERVISOR', label: 'Supervisor', description: 'Guiding students', icon: BookOpenCheck },
]

export default function RegisterPage() {
  const { register, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT',
    phone: '',
    department: '',
  })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  function updateField(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    try {
      await register(form)
      navigate('/', { replace: true })
    } catch (err) {
      setError(apiError(err, 'Registration failed'))
      setFieldErrors(err.response?.data?.fieldErrors || {})
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join ThesisTrack to manage your thesis journey."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <Alert>{error}</Alert>}

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-slate-700">I am a</legend>
          <div className="grid grid-cols-2 gap-3">
            {ROLE_OPTIONS.map((option) => {
              const selected = form.role === option.value
              return (
                <label
                  key={option.value}
                  className={cx(
                    'flex cursor-pointer flex-col gap-1 rounded-lg border p-3 transition-colors',
                    selected
                      ? 'border-brand-500 bg-brand-50/60 ring-1 ring-brand-500'
                      : 'border-slate-300 hover:border-slate-400',
                  )}
                >
                  <input
                    type="radio"
                    name="role"
                    value={option.value}
                    checked={selected}
                    onChange={updateField('role')}
                    className="sr-only"
                  />
                  <option.icon className={cx('h-5 w-5', selected ? 'text-brand-600' : 'text-slate-400')} />
                  <span className="text-sm font-medium text-slate-900">{option.label}</span>
                  <span className="text-xs text-slate-500">{option.description}</span>
                </label>
              )
            })}
          </div>
        </fieldset>

        <Field label="Full name" htmlFor="name" error={fieldErrors.name}>
          <Input id="name" required autoComplete="name" value={form.name} onChange={updateField('name')} invalid={!!fieldErrors.name} />
        </Field>

        <Field label="Email address" htmlFor="email" error={fieldErrors.email}>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@auca.ac.rw"
            value={form.email}
            onChange={updateField('email')}
            invalid={!!fieldErrors.email}
          />
        </Field>

        <Field label="Password" htmlFor="password" error={fieldErrors.password} hint="At least 8 characters.">
          <Input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            value={form.password}
            onChange={updateField('password')}
            invalid={!!fieldErrors.password}
          />
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Department" htmlFor="department" optional>
            <Input id="department" value={form.department} onChange={updateField('department')} />
          </Field>
          <Field label="Phone" htmlFor="phone" optional>
            <Input id="phone" type="tel" autoComplete="tel" value={form.phone} onChange={updateField('phone')} />
          </Field>
        </div>

        <Button type="submit" size="lg" loading={loading} className="w-full">
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  )
}
