import { useEffect, useRef, useState } from 'react'
import apiClient from '../api/client'

function formatSize(kb) {
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`
  return `${kb} KB`
}

function formatDate(value) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function DocumentsPanel({ thesisId, allowUpload = false }) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)
  const fileInputRef = useRef(null)

  async function loadDocuments() {
    setLoading(true)
    setError('')
    try {
      const { data } = await apiClient.get(`/documents/${thesisId}`)
      setDocuments(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load documents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thesisId])

  async function handleFileSelected(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      await apiClient.post(`/documents/${thesisId}`, formData)
      await loadDocuments()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not upload this file')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDownload(doc) {
    setDownloadingId(doc.id)
    setError('')
    try {
      const response = await apiClient.get(`/documents/${thesisId}/${doc.id}/download`, {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.download = doc.fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError('Could not download this file')
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#1A1A2E]">Documents</h2>
        {allowUpload && (
          <label className="cursor-pointer rounded-md bg-[#FF6B35] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#e35a28]">
            {uploading ? 'Uploading…' : 'Upload document'}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelected}
              disabled={uploading}
              className="hidden"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.png,.jpg,.jpeg,.txt"
            />
          </label>
        )}
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : documents.length === 0 ? (
        <p className="text-sm text-gray-500">
          {allowUpload ? 'No documents uploaded yet.' : 'No documents have been uploaded yet.'}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-gray-100">
          {documents.map((doc) => (
            <li key={doc.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-[#1A1A2E]">
                  {doc.fileName}
                  {doc.version > 1 && <span className="ml-1.5 text-xs font-normal text-gray-400">v{doc.version}</span>}
                </p>
                <p className="text-xs text-gray-500">
                  {formatSize(doc.fileSizeKb)} · uploaded by {doc.uploadedByName} · {formatDate(doc.uploadedAt)}
                </p>
              </div>
              <button
                onClick={() => handleDownload(doc)}
                disabled={downloadingId === doc.id}
                className="self-start rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-[#1A1A2E] hover:bg-gray-50 disabled:opacity-50 sm:self-auto"
              >
                {downloadingId === doc.id ? 'Downloading…' : 'Download'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
