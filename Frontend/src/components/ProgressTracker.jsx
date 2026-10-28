const STAGES = [
  { key: 'REGISTERED', label: 'Registered' },
  { key: 'PROTOTYPE_PENDING', label: 'Prototype Review Booked' },
  { key: 'PROTOTYPE_REVIEWED', label: 'Prototype Reviewed' },
  { key: 'SUPERVISOR_ASSIGNED', label: 'Supervisor Assigned' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'READY_FOR_DEFENSE', label: 'Ready for Defense' },
  { key: 'COMPLETED', label: 'Completed' },
]

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export default function ProgressTracker({ status, daysInCurrentStage }) {
  const currentIndex = STAGES.findIndex((s) => s.key === status)

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-lg font-semibold text-[#1A1A2E]">Thesis Progress</h2>

      <ol className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-0">
        {STAGES.map((stage, index) => {
          const isCompleted = index < currentIndex
          const isCurrent = index === currentIndex
          const isUpcoming = index > currentIndex

          return (
            <li key={stage.key} className="flex flex-1 sm:flex-col sm:items-center">
              <div className="flex items-center sm:w-full">
                <div
                  className={[
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold',
                    isCompleted && 'border-[#FF6B35] bg-[#FF6B35] text-white',
                    isCurrent && 'border-[#1A1A2E] bg-[#1A1A2E] text-white ring-4 ring-[#FF6B35]/25',
                    isUpcoming && 'border-gray-300 bg-white text-gray-400',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {isCompleted ? <CheckIcon /> : index + 1}
                </div>

                {index < STAGES.length - 1 && (
                  <div
                    className={[
                      'ml-2 h-0.5 flex-1 sm:ml-0 sm:mt-4 sm:h-0.5 sm:w-full',
                      'hidden sm:block',
                      isCompleted ? 'bg-[#FF6B35]' : 'bg-gray-200',
                    ].join(' ')}
                  />
                )}
              </div>

              <div className="ml-3 sm:ml-0 sm:mt-2 sm:text-center">
                <p
                  className={[
                    'text-sm font-medium',
                    isCurrent ? 'text-[#1A1A2E]' : isCompleted ? 'text-[#1A1A2E]' : 'text-gray-400',
                  ].join(' ')}
                >
                  {stage.label}
                </p>
                {isCurrent && (
                  <p className="mt-0.5 text-xs font-medium text-[#FF6B35]">
                    {daysInCurrentStage} {daysInCurrentStage === 1 ? 'day' : 'days'} in this stage
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
