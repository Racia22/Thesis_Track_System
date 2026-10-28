import { Check } from 'lucide-react'
import { STAGES, daysLabel } from '../lib/format'
import { Card, CardHeader } from './ui'
import { cx } from '../lib/cx'

export default function ProgressTracker({ status, daysInCurrentStage }) {
  const currentIndex = STAGES.findIndex((s) => s.key === status)
  const isFinished = status === 'COMPLETED'
  const percent = Math.round((currentIndex / (STAGES.length - 1)) * 100)

  return (
    <Card>
      <CardHeader
        title="Thesis progress"
        description={`Stage ${currentIndex + 1} of ${STAGES.length}`}
        actions={
          <div className="flex items-center gap-3">
            <div className="hidden h-1.5 w-32 overflow-hidden rounded-full bg-slate-100 sm:block">
              <div className="h-full rounded-full bg-brand-600" style={{ width: `${percent}%` }} />
            </div>
            <span className="text-sm font-semibold text-slate-900">{percent}%</span>
          </div>
        }
      />

      <ol className="grid gap-0 px-5 py-6 lg:grid-cols-7">
        {STAGES.map((stage, index) => {
          const isCompleted = index < currentIndex || (isFinished && index === currentIndex)
          const isCurrent = index === currentIndex && !isFinished
          const isLast = index === STAGES.length - 1

          return (
            <li key={stage.key} className="relative flex gap-4 pb-6 last:pb-0 lg:flex-col lg:items-center lg:gap-3 lg:pb-0 lg:text-center">
              {/* Connector: vertical on small screens, horizontal on large */}
              {!isLast && (
                <>
                  <span
                    className={cx(
                      'absolute top-8 bottom-0 left-4 w-px -translate-x-1/2 lg:hidden',
                      isCompleted ? 'bg-brand-600' : 'bg-slate-200',
                    )}
                    aria-hidden="true"
                  />
                  <span
                    className={cx(
                      'absolute top-4 left-[calc(50%+1.25rem)] hidden h-px w-[calc(100%-2.5rem)] lg:block',
                      isCompleted ? 'bg-brand-600' : 'bg-slate-200',
                    )}
                    aria-hidden="true"
                  />
                </>
              )}

              <span
                className={cx(
                  'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  isCompleted && 'bg-brand-600 text-white',
                  isCurrent && 'bg-white text-brand-700 ring-2 ring-brand-600 ring-offset-2',
                  !isCompleted && !isCurrent && 'bg-white text-slate-400 ring-1 ring-slate-300',
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" strokeWidth={3} /> : index + 1}
              </span>

              <div className="min-w-0 pt-1 lg:px-1 lg:pt-0">
                <p
                  className={cx(
                    'text-sm font-medium lg:text-xs',
                    isCurrent ? 'text-brand-700' : isCompleted ? 'text-slate-900' : 'text-slate-400',
                  )}
                >
                  {stage.label}
                </p>
                {isCurrent && (
                  <p className="mt-0.5 text-xs text-slate-500">{daysLabel(daysInCurrentStage)} in this stage</p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </Card>
  )
}
