import { CalendarCheck, GraduationCap, LineChart, MessagesSquare } from 'lucide-react'

const HIGHLIGHTS = [
  { icon: CalendarCheck, title: 'Prototype reviews', text: 'Book review slots and see exactly where your thesis stands.' },
  { icon: MessagesSquare, title: 'One supervision thread', text: 'Messages and document versions in one place per thesis.' },
  { icon: LineChart, title: 'Bottlenecks at a glance', text: 'Coordinators see who is waiting, and for how long.' },
]

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen bg-white">
      <aside className="relative hidden w-[46%] max-w-xl flex-col justify-between overflow-hidden bg-brand-950 p-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(circle at 15% 10%, rgba(59,110,245,0.45), transparent 45%), radial-gradient(circle at 90% 85%, rgba(37,87,214,0.35), transparent 40%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />

        <div className="relative flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">ThesisTrack</span>
        </div>

        <div className="relative">
          <h2 className="text-3xl leading-tight font-semibold tracking-tight">
            Thesis supervision,
            <br />
            from proposal to defense.
          </h2>
          <ul className="mt-10 space-y-6">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                  <Icon className="h-4 w-4 text-brand-200" />
                </span>
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="mt-0.5 text-sm text-brand-100/70">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-brand-100/60"></p>
      </aside>

      <main className="flex flex-1 items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="text-base font-semibold tracking-tight">ThesisTrack</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>}

          <div className="mt-8">{children}</div>

          {footer && <p className="mt-8 text-center text-sm text-slate-500">{footer}</p>}
        </div>
      </main>
    </div>
  )
}
