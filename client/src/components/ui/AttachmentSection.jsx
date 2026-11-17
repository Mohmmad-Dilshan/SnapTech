import { useState, useRef } from 'react'
import {
  FileText,
  FileSpreadsheet,
  FileImage,
  FileArchive,
  File,
  Download,
  Trash2,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  X,
} from 'lucide-react'
import { api } from '@/utils/api'
import ConfirmModal from './ConfirmModal'

const CATEGORIES = [
  { id: 'GENERAL', label: 'General Document', badge: 'bg-gray-100 text-gray-700 border-gray-200' },
  { id: 'CONTRACT', label: 'Contract / Agreement', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'DELIVERABLE', label: 'Final Deliverable', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'ASSET', label: 'Client Asset', badge: 'bg-blue-50 text-brand-blue border-blue-200' },
  { id: 'INVOICE', label: 'Invoice / Receipt', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
]

export default function AttachmentSection({
  attachments = [],
  leadId,
  taskId,
  clientProjectId,
  onUploadSuccess,
  theme: _theme = 'light',
}) {
  const [uploading, setUploading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('GENERAL')
  const [status, setStatus] = useState(null)
  const [filterCategory, setFilterCategory] = useState('ALL')
  const [previewFile, setPreviewFile] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, fileName: '' })
  const fileInputRef = useRef(null)

  const showStatus = (type, msg) => {
    setStatus({ type, msg })
    setTimeout(() => setStatus(null), 5000)
  }

  // File size formatter
  const formatBytes = (bytes, decimals = 1) => {
    if (!bytes) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }

  // Get corresponding file icon & color based on mimetype
  const getFileIcon = (mimeType = '') => {
    const mime = (mimeType || '').toLowerCase()
    if (mime.startsWith('image/')) {
      return { Icon: FileImage, color: 'text-blue-600 bg-blue-50 border-blue-200' }
    }
    if (mime === 'application/pdf') {
      return { Icon: FileText, color: 'text-rose-600 bg-rose-50 border-rose-200' }
    }
    if (mime.includes('word') || mime.includes('msword')) {
      return { Icon: FileText, color: 'text-sky-600 bg-sky-50 border-sky-200' }
    }
    if (mime.includes('excel') || mime.includes('spreadsheet') || mime.includes('sheet')) {
      return { Icon: FileSpreadsheet, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' }
    }
    if (mime.includes('zip') || mime.includes('compressed')) {
      return { Icon: FileArchive, color: 'text-purple-600 bg-purple-50 border-purple-200' }
    }
    return { Icon: File, color: 'text-gray-600 bg-gray-50 border-gray-200' }
  }

  // Handle file select & upload
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit to 15MB
    if (file.size > 15 * 1024 * 1024) {
      showStatus('error', 'File size exceeds the 15MB limit.')
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', selectedCategory)
    if (leadId) formData.append('leadId', leadId)
    if (taskId) formData.append('taskId', taskId)
    if (clientProjectId) formData.append('clientProjectId', clientProjectId)

    setUploading(true)
    try {
      const res = await api.post('/upload/attachment', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      if (res.data.status === 'ok') {
        showStatus('success', 'File saved to Project Vault!')
        if (onUploadSuccess) onUploadSuccess()
      } else {
        showStatus('error', res.data.message || 'Upload failed.')
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err)
      showStatus('error', err.response?.data?.message || 'Error uploading file.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const executeDelete = async (id) => {
    try {
      const res = await api.delete(`/upload/attachment/${id}`)
      if (res.data.status === 'ok') {
        showStatus('success', 'File removed from vault.')
        if (onUploadSuccess) onUploadSuccess()
      } else {
        showStatus('error', res.data.message || 'Failed to delete file.')
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err)
      showStatus('error', err.response?.data?.message || 'Error deleting file.')
    } finally {
      setConfirmDelete({ isOpen: false, id: null, fileName: '' })
    }
  }

  const filteredAttachments = attachments.filter((item) => {
    if (filterCategory === 'ALL') return true
    return (item.category || 'GENERAL') === filterCategory
  })

  return (
    <div className="space-y-4">
      {/* Vault Upload & Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
            Project Vault ({attachments.length})
          </h4>
          {attachments.length > 0 && (
            <div className="flex items-center gap-1 overflow-x-auto text-[10px]">
              <button
                type="button"
                onClick={() => setFilterCategory('ALL')}
                className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                  filterCategory === 'ALL'
                    ? 'bg-brand-blue text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All ({attachments.length})
              </button>
              {CATEGORIES.map((cat) => {
                const count = attachments.filter((a) => (a.category || 'GENERAL') === cat.id).length
                if (count === 0) return null
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFilterCategory(cat.id)}
                    className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                      filterCategory === cat.id
                        ? 'bg-brand-blue text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat.label} ({count})
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium border border-gray-200 rounded-xl bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-blue"
            title="Select document classification category"
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx,.zip"
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-brand-blue hover:bg-blue-600 px-3.5 py-1.5 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {uploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            Upload File
          </button>
        </div>
      </div>

      {/* Status Notifications */}
      {status && (
        <div
          className={`flex items-center gap-2 text-xs rounded-xl px-3.5 py-2.5 border transition-all ${
            status.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {status.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span className="font-medium">{status.msg}</span>
        </div>
      )}

      {/* Files List / Grid */}
      {filteredAttachments.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
          <p className="text-xs font-bold text-gray-600">No documents in this vault category.</p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            Upload contracts, requirements, designs, screenshots, invoices, or deliverables (up to 15MB)
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredAttachments.map((item) => {
            const { Icon, color } = getFileIcon(item.fileType)
            const catObj = CATEGORIES.find((c) => c.id === (item.category || 'GENERAL')) || CATEGORIES[0]
            const isImage = (item.fileType || '').toLowerCase().startsWith('image/')
            const isPdf = (item.fileType || '').toLowerCase() === 'application/pdf'

            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 border border-gray-200/90 rounded-2xl bg-white hover:border-gray-300 hover:shadow-xs transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className={`p-2.5 rounded-xl border ${color} shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-900 truncate" title={item.fileName}>
                      {item.fileName}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-[10px] text-gray-400 font-mono">
                        {formatBytes(item.fileSize)}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${catObj.badge}`}>
                        {catObj.label}
                      </span>
                      {item.uploadedByRole === 'CLIENT' && (
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                          Client Upload
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {(isImage || isPdf) && (
                    <button
                      type="button"
                      onClick={() => setPreviewFile(item)}
                      className="p-1.5 text-gray-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                      title="Quick Preview"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-gray-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-all"
                    title="Download File"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmDelete({
                        isOpen: true,
                        id: item.id,
                        fileName: item.fileName,
                      })
                    }
                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                    title="Delete File"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* In-App Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-extrabold text-gray-900 truncate">
                  {previewFile.fileName}
                </h3>
                <p className="text-[10px] text-gray-400">
                  {formatBytes(previewFile.fileSize)} &bull; Project Vault Asset
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewFile.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-brand-blue text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewFile(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-gray-50 rounded-2xl p-4 flex items-center justify-center min-h-[300px]">
              {(previewFile.fileType || '').startsWith('image/') ? (
                <img
                  src={previewFile.fileUrl}
                  alt={previewFile.fileName}
                  className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-xs"
                />
              ) : (
                <iframe
                  src={previewFile.fileUrl}
                  title={previewFile.fileName}
                  className="w-full h-[60vh] rounded-xl border border-gray-200"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Deletion Modal */}
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, id: null, fileName: '' })}
        onConfirm={() => executeDelete(confirmDelete.id)}
        title="Delete Vault File"
        message="Are you sure you want to permanently delete this file from the project vault? This action cannot be undone."
        itemTitle={confirmDelete.fileName}
        confirmText="Delete File"
        variant="danger"
      />
    </div>
  )
}
