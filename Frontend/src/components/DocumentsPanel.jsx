import { useEffect, useRef, useState } from 'react'
import {
  Download,
  File,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Presentation,
  UploadCloud,
} from 'lucide-react'
import apiClient from '../api/client'
import { Alert, Badge, Button, Card, CardHeader, EmptyState, Spinner, Table } from './ui'
import { cx } from '../lib/cx'
import { apiError, formatDateTime, formatFileSize } from '../lib/format'

const ACCEPT = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.png,.jpg,.jpeg,.txt'

function fileVisual(fileName) {
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return { icon: FileText, classes: 'bg-red-50 text-red-600' }
  if (['doc', 'docx', 'txt'].includes(ext)) return { icon: FileText, classes: 'bg-brand-50 text-brand-600' }
  if (['ppt', 'pptx'].includes(ext)) return { icon: Presentation, classes: 'bg-orange-50 text-orange-600' }
  if (['xls', 'xlsx'].includes(ext)) return { icon: FileSpreadsheet, classes: 'bg-emerald-50 text-emerald-600' }
  if (['png', 'jpg', 'jpeg'].includes(ext)) return { icon: FileImage, classes: 'bg-violet-50 text-violet-600' }
  if (ext === 'zip') return { icon: FileArchive, classes: 'bg-amber-50 text-amber-600' }
  return { icon: File, classes: 'bg-slate-100 text-slate-600' }
}

function FileName({ doc }) {
  const { icon: Icon, classes } = fileVisual(doc.fileName)
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className={cx('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', classes)}>
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0">
        <p className="truncate font-medium text-slate-900">{doc.fileName}</p>
        <p className="text-xs text-slate-500 md:hidden">
          {formatFileSize(doc.fileSizeKb)} · {doc.uploadedByName} · {formatDateTime(doc.uploadedAt)}
        </p>
      </div>
    </div>
  )
}

export default function DocumentsPanel({ thesisId, allowUpload = false }) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)
  const fileInputRef = useRef(null)

  async function loadDocuments() {
    try {
      const { data } = await apiClient.get(`/documents/${thesisId}`)
      setDocuments(data)
    } catch (err) {
      setError(apiError(err, 'Could not load documents'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    setError('')
    loadDocuments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thesisId])

  async function upload(file) {
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      await apiClient.post(`/documents/${thesisId}`, formData)
      await loadDocuments()
    } catch (err) {
      setError(apiError(err, 'Could not upload this file'))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    upload(e.dataTransfer.files?.[0])
  }

  async function handleDownload(doc) {
    setDownloadingId(doc.id)
    setError('')
    try {
      const response = await apiClient.get(`/documents/${thesisId}/${doc.id}/download`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.download = doc.fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      setError('Could not download this file')
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {allowUpload && (
        <label
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cx(
            'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors',
            dragging ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50',
            uploading && 'pointer-events-none opacity-70',
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={(e) => upload(e.target.files?.[0])}
            disabled={uploading}
            className="sr-only"
            accept={ACCEPT}
          />
          <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            {uploading ? <Spinner className="text-brand-600" /> : <UploadCloud className="h-5 w-5" />}
          </span>
          <p className="text-sm font-medium text-slate-900">
            {uploading ? 'Uploading…' : (
              <>
                <span className="text-brand-600">Click to upload</span> or drag and drop
              </>
            )}
          </p>
          <p className="mt-1 text-xs text-slate-500">PDF, Word, PowerPoint, Excel, images, ZIP or TXT · up to 20 MB</p>
        </label>
      )}

      {error && <Alert>{error}</Alert>}

      <Card>
        <CardHeader
          title="Files"
          description={!loading && documents.length > 0 ? `${documents.length} ${documents.length === 1 ? 'file' : 'files'}` : undefined}
        />
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : documents.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No documents yet"
            description={allowUpload ? 'Upload your first draft to share it with your supervisor.' : 'The student has not uploaded any documents yet.'}
          />
        ) : (
          <Table
            minWidth={0}
            columns={[
              { label: 'Name' },
              { label: 'Version', className: 'hidden md:table-cell' },
              { label: 'Size', className: 'hidden md:table-cell' },
              { label: 'Uploaded by', className: 'hidden md:table-cell' },
              { label: 'Date', className: 'hidden md:table-cell' },
              { label: <span className="sr-only">Actions</span>, key: 'actions', align: 'right' },
            ]}
          >
            {documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-slate-50/60">
                <td className="max-w-0 px-5 py-3 md:max-w-xs">
                  <FileName doc={doc} />
                </td>
                <td className="hidden px-5 py-3 md:table-cell">
                  <Badge tone={doc.version > 1 ? 'brand' : 'slate'}>v{doc.version}</Badge>
                </td>
                <td className="hidden px-5 py-3 text-slate-600 md:table-cell">{formatFileSize(doc.fileSizeKb)}</td>
                <td className="hidden px-5 py-3 text-slate-600 md:table-cell">{doc.uploadedByName}</td>
                <td className="hidden px-5 py-3 whitespace-nowrap text-slate-600 md:table-cell">{formatDateTime(doc.uploadedAt)}</td>
                <td className="px-5 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Download}
                    onClick={() => handleDownload(doc)}
                    loading={downloadingId === doc.id}
                    aria-label={`Download ${doc.fileName}`}
                  >
                    <span className="hidden sm:inline">Download</span>
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  )
}
