import { useEffect, useState } from 'react'
import { AlertTriangle, BarChart3, BookOpen, CheckCircle2, Table2, Timer, Users } from 'lucide-react'
import apiClient from '../../api/client'
import VerticalBarChart from '../../components/charts/VerticalBarChart'
import HorizontalBarChart from '../../components/charts/HorizontalBarChart'
import { CHART_COLORS } from '../../components/charts/chartUtils'
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  LoadingState,
  PageHeader,
  StatCard,
  Table,
} from '../../components/ui'
import { apiError, daysLabel, stageInfo } from '../../lib/format'

const WAIT_SERIES = [
  { key: 'current', label: 'Waiting now (avg.)', color: CHART_COLORS.primary, hover: CHART_COLORS.primaryHover },
  { key: 'historical', label: 'Historical avg. per visit', color: CHART_COLORS.secondary, hover: CHART_COLORS.secondaryHover },
]

function ChartCard({ title, description, tableHeaders, tableRows, children, className }) {
  const [showTable, setShowTable] = useState(false)

  return (
    <Card className={className}>
      <CardHeader
        title={title}
        description={description}
        actions={
          <Button
            variant="ghost"
            size="sm"
            icon={showTable ? BarChart3 : Table2}
            onClick={() => setShowTable((v) => !v)}
          >
            {showTable ? 'Chart' : 'Table'}
          </Button>
        }
      />
      {showTable ? (
        <Table minWidth={0} columns={tableHeaders.map((h, i) => ({ label: h, align: i > 0 ? 'right' : undefined }))}>
          {tableRows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className={`px-5 py-2.5 text-slate-700 ${j > 0 ? 'text-right tabular-nums' : ''}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </Table>
      ) : (
        <CardBody>{children}</CardBody>
      )}
    </Card>
  )
}

export default function AnalyticsDashboard() {
  const [distribution, setDistribution] = useState([])
  const [waitTimes, setWaitTimes] = useState([])
  const [workload, setWorkload] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      apiClient.get('/analytics/stage-distribution'),
      apiClient.get('/analytics/wait-times'),
      apiClient.get('/analytics/supervisor-workload'),
    ])
      .then(([dist, wait, load]) => {
        setDistribution(dist.data)
        setWaitTimes(wait.data)
        setWorkload(load.data)
      })
      .catch((err) => setError(apiError(err, 'Could not load analytics')))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState label="Loading analytics…" />

  const total = distribution.reduce((sum, d) => sum + d.count, 0)
  const completed = distribution.find((d) => d.status === 'COMPLETED')?.count ?? 0
  const active = total - completed
  const bottleneck = [...waitTimes]
    .filter((w) => w.thesisCount > 0 && w.status !== 'COMPLETED')
    .sort((a, b) => b.averageDays - a.averageDays)[0]
  const avgLoad = workload.length
    ? (workload.reduce((sum, w) => sum + w.currentStudentCount, 0) / workload.length).toFixed(1)
    : '—'

  const distributionData = distribution.map((d) => ({ label: stageInfo(d.status).short, value: d.count }))
  const waitData = waitTimes.map((w) => ({
    label: stageInfo(w.status).short,
    current: w.averageDays,
    historical: w.historicalAverageDays,
  }))
  const workloadData = workload.map((w) => ({ label: w.name, value: w.currentStudentCount }))

  return (
    <>
      <PageHeader title="Analytics" description="Programme-wide view of thesis progress, wait times and supervisor load." />

      {error && <Alert className="mb-6">{error}</Alert>}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active theses" value={active} hint={`${total} registered in total`} icon={BookOpen} />
        <StatCard label="Completed" value={completed} hint={total ? `${Math.round((completed / total) * 100)}% of all theses` : undefined} icon={CheckCircle2} tone="green" />
        <StatCard label="Supervisors" value={workload.length} hint={`Avg. ${avgLoad} active students each`} icon={Users} tone="violet" />
        <StatCard
          label="Biggest bottleneck"
          value={bottleneck ? stageInfo(bottleneck.status).short : '—'}
          hint={bottleneck && `${bottleneck.thesisCount} waiting · avg. ${daysLabel(bottleneck.averageDays)}`}
          icon={bottleneck ? AlertTriangle : Timer}
          tone={bottleneck ? 'red' : 'brand'}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard
          title="Wait time per stage"
          description="Theses waiting now vs. how long a stage has historically taken"
          tableHeaders={['Stage', 'Waiting now', 'Avg. now (days)', 'Historical avg. (days)', 'Past visits']}
          tableRows={waitTimes.map((w) => [stageInfo(w.status).label, w.thesisCount, w.averageDays, w.historicalAverageDays, w.historicalSampleSize])}
          className="xl:col-span-2"
        >
          <VerticalBarChart data={waitData} series={WAIT_SERIES} valueSuffix="d" width={1040} />
        </ChartCard>

        <ChartCard
          title="Stage distribution"
          description="Students currently at each stage"
          tableHeaders={['Stage', 'Students']}
          tableRows={distribution.map((d) => [stageInfo(d.status).label, d.count])}
        >
          <VerticalBarChart data={distributionData} width={500} />
        </ChartCard>

        <ChartCard
          title="Supervisor workload"
          description="Active students per supervisor"
          tableHeaders={['Supervisor', 'Active students']}
          tableRows={workloadData.map((w) => [w.label, w.value])}
        >
          <HorizontalBarChart data={workloadData} width={500} />
        </ChartCard>
      </div>
    </>
  )
}
