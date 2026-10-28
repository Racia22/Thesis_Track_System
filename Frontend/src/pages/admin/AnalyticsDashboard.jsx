import { useEffect, useState } from 'react'
import apiClient from '../../api/client'
import VerticalBarChart from '../../components/charts/VerticalBarChart'
import HorizontalBarChart from '../../components/charts/HorizontalBarChart'

function stageLabel(status) {
  return status
    .toLowerCase()
    .split('_')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ')
}

function ChartCard({ title, subtitle, children, tableRows, tableHeaders }) {
  const [showTable, setShowTable] = useState(false)

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-[#1A1A2E]">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        <button
          onClick={() => setShowTable((v) => !v)}
          className="shrink-0 rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-[#1A1A2E] hover:bg-gray-50"
        >
          {showTable ? 'Show chart' : 'Show table'}
        </button>
      </div>

      {showTable ? (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-500">
              {tableHeaders.map((h) => (
                <th key={h} className="py-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tableRows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} className="py-2 text-[#1A1A2E]">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        children
      )}
    </div>
  )
}

export default function AnalyticsDashboard() {
  const [distribution, setDistribution] = useState([])
  const [waitTimes, setWaitTimes] = useState([])
  const [workload, setWorkload] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      apiClient.get('/analytics/stage-distribution'),
      apiClient.get('/analytics/wait-times'),
      apiClient.get('/analytics/supervisor-workload'),
    ]).then(([dist, wait, load]) => {
      setDistribution(dist.data)
      setWaitTimes(wait.data)
      setWorkload(load.data)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return <p className="text-sm text-gray-500">Loading analytics…</p>
  }

  const bottleneck = waitTimes
    .filter((w) => w.thesisCount > 0)
    .sort((a, b) => b.averageDays - a.averageDays)[0]

  const distributionData = distribution.map((d) => ({ label: stageLabel(d.status), value: d.count }))
  const waitTimesData = waitTimes.map((w) => ({ label: stageLabel(w.status), value: w.averageDays }))
  const workloadData = workload.map((w) => ({ label: w.name, value: w.currentStudentCount }))

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-[#1A1A2E]">Analytics</h1>

      {bottleneck && (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-[#1A1A2E]">Biggest bottleneck right now</p>
          <p className="mt-1 text-3xl font-semibold text-[#FF6B35]">{stageLabel(bottleneck.status)}</p>
          <p className="mt-1 text-sm text-gray-500">
            {bottleneck.thesisCount} {bottleneck.thesisCount === 1 ? 'student has' : 'students have'} been waiting an
            average of {bottleneck.averageDays} {bottleneck.averageDays === 1 ? 'day' : 'days'} in this stage
          </p>
        </div>
      )}

      <ChartCard
        title="Stage distribution"
        subtitle="Number of students currently at each stage"
        tableHeaders={['Stage', 'Students']}
        tableRows={distributionData.map((d) => [d.label, d.value])}
      >
        <VerticalBarChart data={distributionData} valueSuffix="" />
      </ChartCard>

      <ChartCard
        title="Average wait time per stage"
        subtitle="Average days students currently in each stage have been waiting there"
        tableHeaders={['Stage', 'Avg. days', 'Students']}
        tableRows={waitTimes.map((w) => [stageLabel(w.status), w.averageDays, w.thesisCount])}
      >
        <VerticalBarChart data={waitTimesData} valueSuffix="d" />
      </ChartCard>

      <ChartCard
        title="Supervisor workload"
        subtitle="Active students per supervisor"
        tableHeaders={['Supervisor', 'Active students']}
        tableRows={workloadData.map((w) => [w.label, w.value])}
      >
        <HorizontalBarChart data={workloadData} valueSuffix="" />
      </ChartCard>
    </div>
  )
}
