import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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
      const data = await register(form)
      const redirectTo = data.user.role === 'STUDENT' ? '/student/dashboard' : '/'
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
      setFieldErrors(err.response?.data?.fieldErrors || {})
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FFF8F0] px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-[#1A1A2E]">Create your account</h1>
        <p className="mb-6 text-sm text-gray-500">ThesisTrack — AUCA</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#1A1A2E]">Full name</label>
            <input
              required
              value={form.name}
              onChange={updateField('name')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35]"
            />
            {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#1A1A2E]">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={updateField('email')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35]"
            />
            {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#1A1A2E]">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={updateField('password')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35]"
            />
            {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#1A1A2E]">I am a</label>
            <select
              value={form.role}
              onChange={updateField('role')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35]"
            >
              <option value="STUDENT">Student</option>
              <option value="SUPERVISOR">Supervisor</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#1A1A2E]">Phone (optional)</label>
            <input
              value={form.phone}
              onChange={updateField('phone')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#1A1A2E]">Department (optional)</label>
            <input
              value={form.department}
              onChange={updateField('department')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35]"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-md bg-[#FF6B35] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e35a28] disabled:opacity-60"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-[#FF6B35] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
