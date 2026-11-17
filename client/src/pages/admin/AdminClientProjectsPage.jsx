/**
 * AdminClientProjectsPage.jsx — Enterprise Client Projects Tracker & Vault
 * Integrated Daily Work Logs, Bug/Issue Tracker, Feature Pipeline, Management Reporting, and 360° Workspace.
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Search,
  Calendar,
  DollarSign,
  User,
  Tag,
  Clock,
  FolderOpen,
  Download,
  Eye,
  FileCheck,
  RefreshCw,
  Sparkles,
  Send,
  Building2,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  Briefcase,
  Globe,
  ExternalLink,
  Code2,
  AlertTriangle,
  Bug,
  Layers,
  Lock,
  BarChart3,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { api } from '@/utils/api'
import { SEO, ConfirmModal } from '@/components/ui'
import AttachmentSection from '@/components/ui/AttachmentSection'
import AdminBillingSection from '@/components/admin/AdminBillingSection'
import BossReportModal from '@/components/admin/BossReportModal'
import ProjectWorkspaceDrawer from '@/components/admin/ProjectWorkspaceDrawer'
import { useToast } from '@/components/ui/ToastProvider'

const STATUSES = ['PLANNING', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'ON_HOLD']
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

const PROJECT_TYPES = [
  'Website Development',
  'Web Application',
  'Mobile Application',
  'Client Portal',
  'Admin Panel',
  'E-Commerce Website',
  'API / Backend Development',
  'Maintenance & Support',
  'Custom Project',
]

const STATUS_LABELS = {
  PLANNING: 'Planning',
  IN_PROGRESS: 'In Progress',
  REVIEW: 'Review',
  COMPLETED: 'Completed',
  ON_HOLD: 'On Hold',
}

const STATUS_COLORS = {
  PLANNING: 'bg-sky-50 text-sky-700 border-sky-200/80',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200/80 font-bold',
  REVIEW: 'bg-amber-50 text-amber-700 border-amber-200/80 font-bold',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 font-bold',
  ON_HOLD: 'bg-rose-50 text-rose-700 border-rose-200/80 font-bold',
}

const PRIORITY_COLORS = {
  LOW: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200/80',
  HIGH: 'bg-orange-50 text-orange-700 border-orange-200/80 font-bold',
  URGENT: 'bg-rose-50 text-rose-700 border-rose-200/80 font-extrabold ring-1 ring-rose-500/20',
}

const HEALTH_COLORS = {
  ON_TRACK: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  AT_RISK: 'bg-amber-50 text-amber-700 border-amber-200 font-bold',
  DELAYED: 'bg-rose-50 text-rose-700 border-rose-200 font-bold ring-1 ring-rose-500/20',
}

const inputCls =
  'w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all font-sans'

function ProjectForm({ initial, onSave, onCancel, loading, onAttachmentChange }) {
  const toast = useToast()

  const { data: clients = [] } = useQuery({
    queryKey: ['admin-clients-list-for-dropdown'],
    queryFn: () => api.get('/admin/clients').then((r) => r.data),
  })

  const { data: assignableTeam = [] } = useQuery({
    queryKey: ['admin-assignable-team-dropdown'],
    queryFn: () => api.get('/admin/users/list-assignable').then((r) => r.data),
  })

  const formatDateForInput = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    return d.toISOString().split('T')[0]
  }

  const { register, handleSubmit, watch, setValue, getValues } = useForm({
    defaultValues: initial
      ? {
          ...initial,
          startDate: formatDateForInput(initial.startDate),
          deadline: formatDateForInput(initial.deadline),
          tags: initial.tags ? initial.tags.join(', ') : '',
          clientId: initial.clientId || '',
          assignedTo: initial.assignedTo || '',
          assignedToEmail: initial.assignedToEmail || '',
          projectType: initial.projectType || 'Website Development',
          health: initial.health || 'ON_TRACK',
          liveUrl: initial.liveUrl || '',
          stagingUrl: initial.stagingUrl || '',
          repoUrl: initial.repoUrl || '',
          credentialsNotes: initial.credentialsNotes || '',
        }
      : {
          clientName: '',
          projectTitle: '',
          description: '',
          startDate: formatDateForInput(new Date()),
          deadline: '',
          assignedTo: '',
          assignedToEmail: '',
          budget: '',
          tags: '',
          notes: '',
          status: 'PLANNING',
          priority: 'MEDIUM',
          progress: 0,
          clientId: '',
          projectType: 'Website Development',
          health: 'ON_TRACK',
          liveUrl: '',
          stagingUrl: '',
          repoUrl: '',
          credentialsNotes: '',
        },
  })

  const watchedProgress = watch('progress') || 0

  const onSubmit = (data) => {
    const payload = {
      projectTitle: data.projectTitle,
      clientName: data.clientName,
      description: data.description || '',
      startDate: data.startDate,
      deadline: data.deadline,
      assignedTo: data.assignedTo || '',
      assignedToEmail: data.assignedToEmail || '',
      budget: data.budget || '',
      notes: data.notes || '',
      status: data.status || 'PLANNING',
      priority: data.priority || 'MEDIUM',
      progress: parseInt(data.progress || 0),
      clientId: data.clientId || null,
      projectType: data.projectType || 'Website Development',
      health: data.health || 'ON_TRACK',
      liveUrl: data.liveUrl || null,
      stagingUrl: data.stagingUrl || null,
      repoUrl: data.repoUrl || null,
      credentialsNotes: data.credentialsNotes || null,
      tags: data.tags
        ? typeof data.tags === 'string'
          ? data.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : data.tags
        : [],
    }
    onSave(payload)
  }

  const onFormError = (errors) => {
    const errorFields = Object.keys(errors).join(', ')
    toast.error(`Please fill in all required fields: ${errorFields}`)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, onFormError)} className="space-y-6">
      {/* Section 1: Core Client & Project Identification */}
      <div className="bg-gray-50/60 p-5 rounded-2xl border border-gray-200/80 space-y-4">
        <p className="text-xs font-bold text-brand-blue uppercase tracking-wider flex items-center gap-2">
          <span>📋</span> 1. Core Identification &amp; Client Account
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">
              Project Title *
            </label>
            <input
              {...register('projectTitle', { required: true })}
              className={inputCls}
              placeholder="e.g. E-Commerce Website & Mobile App"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">
              Client Business / Name *
            </label>
            <input
              {...register('clientName', { required: true })}
              className={inputCls}
              placeholder="e.g. Ramesh Textiles Pvt Ltd"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">
              Project Type / Category
            </label>
            <select {...register('projectType')} className={inputCls}>
              {PROJECT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">
              Link Client Portal Account (Optional)
            </label>
            <select
              {...register('clientId')}
              className={inputCls}
              onChange={(e) => {
                const selectedId = e.target.value
                setValue('clientId', selectedId)
                if (selectedId) {
                  const matchedClient = clients.find((c) => c.id === selectedId)
                  if (matchedClient && !getValues('clientName')) {
                    setValue('clientName', matchedClient.name)
                  }
                }
              }}
            >
              <option value="">-- No Client Portal Account linked --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-gray-700 block mb-1.5">
              Assigned To (Team Lead / Staff)
            </label>
            <select
              className={inputCls}
              value={
                watch('assignedTo') && watch('assignedToEmail')
                  ? `${watch('assignedTo')}||${watch('assignedToEmail')}`
                  : watch('assignedTo') || ''
              }
              onChange={(e) => {
                const selectedVal = e.target.value
                const parts = selectedVal.split('||')
                const nameVal = parts[0] || ''
                const emailVal = parts[1] || ''
                setValue('assignedTo', nameVal)
                setValue('assignedToEmail', emailVal)
              }}
            >
              <option value="">-- Unassigned --</option>
              {assignableTeam.map((m) => {
                const displayName = m.name || m.email.split('@')[0].toUpperCase()
                const roleLabel = m.role === 'SUPER_ADMIN' ? 'Super Admin' : m.role === 'ADMIN' ? 'Admin' : 'Staff'
                const optValue = `${displayName}||${m.email}`
                return (
                  <option key={m.id} value={optValue}>
                    👤 {displayName} ({m.email}) — [{roleLabel}]
                  </option>
                )
              })}
            </select>
            <input type="hidden" {...register('assignedToEmail')} />
          </div>
        </div>
      </div>

      {/* Section 2: Financial Budget & Schedule */}
      <div className="bg-gray-50/60 p-5 rounded-2xl border border-gray-200/80 space-y-4">
        <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-2">
          <span>💵</span> 2. Financial Budget, Schedule &amp; Health
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">Budget (₹)</label>
            <input {...register('budget')} className={inputCls} placeholder="e.g. ₹75,000" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">Start Date *</label>
            <input
              type="date"
              {...register('startDate', { required: true })}
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">Deadline *</label>
            <input
              type="date"
              {...register('deadline', { required: true })}
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">Project Health</label>
            <select {...register('health')} className={inputCls}>
              <option value="ON_TRACK">● On Track (Normal)</option>
              <option value="AT_RISK">● At Risk (Blockers)</option>
              <option value="DELAYED">● Delayed (Past SLA)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 3: Deployment & Repository URLs */}
      <div className="bg-gray-50/60 p-5 rounded-2xl border border-gray-200/80 space-y-4">
        <p className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-2">
          <span>🌐</span> 3. Deployment, Testing &amp; Source Code Links
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">Live Production URL</label>
            <input
              {...register('liveUrl')}
              placeholder="https://example.com"
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">Staging / Test URL</label>
            <input
              {...register('stagingUrl')}
              placeholder="https://staging.example.com"
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">Git Repository URL</label>
            <input
              {...register('repoUrl')}
              placeholder="https://github.com/..."
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* Section 4: Lifecycle Status & Completion Progress */}
      <div className="bg-gray-50/60 p-5 rounded-2xl border border-gray-200/80 space-y-4">
        <p className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-2">
          <span>📈</span> 4. Lifecycle Status &amp; Completion Progress
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">Lifecycle Status</label>
            <select {...register('status')} className={inputCls}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">Priority Level</label>
            <select {...register('priority')} className={inputCls}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">
              Tags (Comma Separated)
            </label>
            <input {...register('tags')} className={inputCls} placeholder="Web, React, E-Commerce, SEO" />
          </div>
          <div className="sm:col-span-3 bg-white p-4.5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-gray-800 flex-wrap gap-2">
              <span className="flex items-center gap-1.5">
                <span>🎯</span> Completion Progress Tracker
              </span>
              <div className="flex items-center gap-1.5">
                {[0, 25, 50, 75, 100].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setValue('progress', preset)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                      Number(watchedProgress) === preset
                        ? 'bg-brand-blue text-white border-brand-blue shadow-xs'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {preset}%
                  </button>
                ))}
                <span className="px-2.5 py-0.5 rounded-full bg-linear-to-r from-brand-blue to-indigo-600 text-white font-mono font-bold text-[11px] ml-1 shadow-xs">
                  {watchedProgress}%
                </span>
              </div>
            </div>

            {/* Live Visual Gradient Progress Fill Bar */}
            <div className="relative pt-1">
              <div className="overflow-hidden h-3 text-xs flex rounded-full bg-gray-150 border border-gray-200/80 shadow-inner">
                <div
                  style={{ width: `${watchedProgress}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-linear-to-r from-brand-blue via-indigo-600 to-emerald-500 transition-all duration-300 rounded-full"
                />
              </div>
              <input
                type="range"
                min="0"
                max="100"
                {...register('progress')}
                className="w-full h-3 opacity-0 cursor-pointer absolute top-1 left-0 z-10"
                title="Slide to change project completion progress"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 5: Brief Description, Confidential Notes & Credentials */}
      <div className="bg-gray-50/60 p-5 rounded-2xl border border-gray-200/80 space-y-4">
        <p className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-2">
          <span>📝</span> 5. Project Brief, Internal Notes &amp; Credentials
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">
              Client Visible Project Brief
            </label>
            <textarea
              rows={3}
              {...register('description')}
              className={`${inputCls} resize-none`}
              placeholder="Overview of project deliverables, features, tech stack..."
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">
              Confidential Internal Admin Notes
            </label>
            <textarea
              rows={3}
              {...register('notes')}
              className={`${inputCls} resize-none bg-amber-50/30 border-amber-200/60 focus:bg-white`}
              placeholder="Internal agreements, team milestones, meeting notes..."
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-amber-900 block mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              Confidential Access Credentials (Server, Hosting, API Keys)
            </label>
            <textarea
              rows={2}
              {...register('credentialsNotes')}
              className={`${inputCls} resize-none bg-amber-50/40 border-amber-200 font-mono text-xs focus:bg-white`}
              placeholder="e.g. CPanel login, AWS EC2 IP, Razorpay Key ID (stored securely for internal team)..."
            />
          </div>
        </div>
      </div>

      {/* Section 6: Attachment File Vault (If Editing Existing Project) */}
      {initial && (
        <div className="bg-gray-50/60 p-5 rounded-2xl border border-gray-200/80 space-y-4">
          <p className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-2">
            <span>📎</span> 6. Project Vault File Attachments &amp; Assets
          </p>
          <AttachmentSection
            attachments={initial.attachments}
            clientProjectId={initial.id}
            onUploadSuccess={onAttachmentChange}
          />
        </div>
      )}

      {/* Form Submit & Cancel Controls */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-brand-blue hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-brand-blue/20 hover:-translate-y-0.5 transition-all disabled:opacity-60 cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>{loading ? 'Saving Changes...' : 'Save & Publish Project'}</span>
        </button>
      </div>
    </form>
  )
}

export default function AdminClientProjectsPage() {
  const qc = useQueryClient()
  const toast = useToast()

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [portalLinkFilter, setPortalLinkFilter] = useState('ALL')
  const [projectTypeFilter, setProjectTypeFilter] = useState('ALL')
  const [clientFilter, setClientFilter] = useState('ALL')
  const [healthFilter, setHealthFilter] = useState('ALL')

  // Modals & Drawers
  const [workspaceProject, setWorkspaceProject] = useState(null)
  const [showBossReport, setShowBossReport] = useState(false)

  // Confirm Modals state
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    id: null,
    title: '',
  })

  const [resendConfirm, setResendConfirm] = useState({
    isOpen: false,
    clientId: null,
    email: '',
  })

  // Queries
  const { data: projects = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-client-projects'],
    queryFn: () => api.get('/admin/client-projects').then((r) => r.data),
  })

  const { data: clients = [] } = useQuery({
    queryKey: ['admin-clients-list'],
    queryFn: () => api.get('/admin/clients').then((r) => r.data),
  })

  const { data: assignableTeam = [] } = useQuery({
    queryKey: ['admin-assignable-team-dropdown'],
    queryFn: () => api.get('/admin/users/list-assignable').then((r) => r.data),
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => api.post('/admin/client-projects', data),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin-client-projects'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
      setShowForm(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      toast.success('Project created! Client & assigned staff have been notified.')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to create client project.')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/admin/client-projects/${id}`, data),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin-client-projects'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
      setEditing(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      toast.success('Project updated successfully!')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to update client project.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/client-projects/${id}`),
    onSuccess: (_, deletedId) => {
      toast.info('Client project removed from system.')
      qc.setQueryData(['admin-client-projects'], (old) => {
        if (!Array.isArray(old)) return old
        return old.filter((p) => p.id !== deletedId)
      })
      qc.invalidateQueries({ queryKey: ['admin-client-projects'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete project', 'error')
    },
  })

  const resendCredentialsMutation = useMutation({
    mutationFn: (clientId) => api.post(`/admin/clients/${clientId}/resend-welcome`),
    onSuccess: () => {
      toast.success('Portal login credentials email sent to client!')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to send credentials.')
    },
  })

  const hasActiveFilters =
    searchTerm !== '' ||
    statusFilter !== 'ALL' ||
    priorityFilter !== 'ALL' ||
    portalLinkFilter !== 'ALL' ||
    projectTypeFilter !== 'ALL' ||
    clientFilter !== 'ALL' ||
    healthFilter !== 'ALL'

  const resetFilters = () => {
    setSearchTerm('')
    setStatusFilter('ALL')
    setPriorityFilter('ALL')
    setPortalLinkFilter('ALL')
    setProjectTypeFilter('ALL')
    setClientFilter('ALL')
    setHealthFilter('ALL')
  }

  const handleExportCSV = () => {
    const headers = [
      'Project Title',
      'Client Name',
      'Type',
      'Status',
      'Health',
      'Priority',
      'Progress (%)',
      'Budget',
      'Start Date',
      'Deadline',
      'Assigned To',
      'Live URL',
    ]
    const rows = projects.map((p) => [
      `"${p.projectTitle.replace(/"/g, '""')}"`,
      `"${p.clientName.replace(/"/g, '""')}"`,
      `"${p.projectType || 'Website'}"`,
      p.status,
      p.health || 'ON_TRACK',
      p.priority,
      p.progress,
      `"${(p.budget || '').replace(/"/g, '""')}"`,
      new Date(p.startDate).toISOString().split('T')[0],
      new Date(p.deadline).toISOString().split('T')[0],
      `"${(p.assignedTo || '').replace(/"/g, '""')}"`,
      `"${(p.liveUrl || '').replace(/"/g, '""')}"`,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `SnapTech_Client_Projects_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleAttachmentChange = async () => {
    const updated = await refetch()
    const list = Array.isArray(updated.data) ? updated.data : []
    const found = list.find((p) => p.id === editing?.id)
    if (found) setEditing(found)
  }

  const getDeadlineText = (deadlineStr, status) => {
    if (status === 'COMPLETED') {
      return { text: 'Completed', color: 'text-emerald-700 bg-emerald-50 border-emerald-200 font-bold' }
    }
    const deadline = new Date(deadlineStr)
    const now = new Date()
    const diffTime = deadline - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return {
        text: `Overdue by ${Math.abs(diffDays)}d`,
        color: 'text-rose-700 bg-rose-50 border-rose-200 font-bold',
      }
    }
    if (diffDays === 0) {
      return {
        text: 'Due Today',
        color: 'text-amber-700 bg-amber-50 border-amber-200 font-semibold',
      }
    }
    if (diffDays === 1) {
      return { text: 'Due Tomorrow', color: 'text-amber-700 bg-amber-50 border-amber-200' }
    }
    return { text: `${diffDays} days left`, color: 'text-gray-600 bg-gray-50 border-gray-200' }
  }

  const handleDeleteClick = (project) => {
    setDeleteConfirm({
      isOpen: true,
      id: project.id,
      title: project.projectTitle,
    })
  }

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      !searchTerm ||
      p.projectTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.assignedTo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tags?.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter
    const matchesPriority = priorityFilter === 'ALL' || p.priority === priorityFilter
    const matchesPortalLink =
      portalLinkFilter === 'ALL' ||
      (portalLinkFilter === 'LINKED' && p.client) ||
      (portalLinkFilter === 'UNLINKED' && !p.client)
    const matchesProjectType = projectTypeFilter === 'ALL' || (p.projectType || 'Website Development') === projectTypeFilter
    const matchesClient = clientFilter === 'ALL' || p.clientName === clientFilter || p.clientId === clientFilter
    const matchesHealth = healthFilter === 'ALL' || (p.health || 'ON_TRACK') === healthFilter

    return matchesSearch && matchesStatus && matchesPriority && matchesPortalLink && matchesProjectType && matchesClient && matchesHealth
  })

  // Selected Client Summary for Client Profile Portfolio View
  const selectedClientProjects = clientFilter !== 'ALL'
    ? projects.filter((p) => p.clientName === clientFilter || p.clientId === clientFilter)
    : []

  // Summary Metrics
  const totalOpenIssues = projects.reduce((acc, p) => acc + (p.issues?.filter((i) => i.status !== 'RESOLVED').length || 0), 0)

  const stats = {
    total: projects.length,
    active: projects.filter((p) => p.status !== 'COMPLETED').length,
    completed: projects.filter((p) => p.status === 'COMPLETED').length,
    overdue: projects.filter((p) => {
      if (p.status === 'COMPLETED') return false
      return new Date(p.deadline) < new Date()
    }).length,
    openIssues: totalOpenIssues,
  }

  return (
    <>
      <SEO title="Client Projects Tracker & Vault" noIndex />
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* ── Executive Dark Header Banner ────────────────────────── */}
        <div className="bg-linear-to-r from-slate-900 via-gray-900 to-brand-blue p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-blue/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
                <Briefcase className="w-7 h-7 text-blue-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight">
                    Client Projects Tracker &amp; Vault
                  </h1>
                  <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 uppercase tracking-wider">
                    Executive Portal
                  </span>
                </div>
                <p className="text-gray-300 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
                  Track daily development work, issues, new features, milestone deliverables, file vault assets, and generate management reports.
                </p>
              </div>
            </div>

            {/* Header Controls: Boss Reports, Export & Add */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                onClick={() => setShowBossReport(true)}
                className="px-4 py-2.5 bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-xs sm:text-sm font-extrabold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
                title="Open Executive Boss & Management Reporting Generator"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Boss Reports</span>
              </button>

              <button
                onClick={() => {
                  refetch()
                  toast.info('Projects refreshed from database.')
                }}
                className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 text-white"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>

              {projects.length > 0 && (
                <button
                  onClick={handleExportCSV}
                  className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 text-white"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>CSV</span>
                </button>
              )}

              {!showForm && !editing && (
                <button
                  onClick={() => {
                    setShowForm(true)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="px-4 py-2.5 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Project</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Summary Metric Stats Row ────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-3 hover:shadow-sm transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-700 border border-gray-200 flex items-center justify-center shrink-0">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Projects</p>
              <p className="text-xl font-extrabold font-heading text-gray-900">
                {isLoading ? '…' : stats.total}
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-3 hover:shadow-sm transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-blue border border-blue-100 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Work</p>
              <p className="text-xl font-extrabold font-heading text-brand-blue">
                {isLoading ? '…' : stats.active}
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-3 hover:shadow-sm transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Completed</p>
              <p className="text-xl font-extrabold font-heading text-emerald-600">
                {isLoading ? '…' : stats.completed}
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-3 hover:shadow-sm transition-shadow">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              stats.overdue > 0 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-gray-50 text-gray-400 border-gray-200'
            }`}>
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Overdue SLA</p>
              <p className={`text-xl font-extrabold font-heading ${stats.overdue > 0 ? 'text-rose-600' : 'text-gray-900'}`}>
                {isLoading ? '…' : stats.overdue}
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-3 hover:shadow-sm transition-shadow">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              stats.openIssues > 0 ? 'bg-rose-50 text-rose-600 border-rose-200 ring-1 ring-rose-400/20' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
            }`}>
              <Bug className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Open Blockers</p>
              <p className={`text-xl font-extrabold font-heading ${stats.openIssues > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {isLoading ? '…' : stats.openIssues}
              </p>
            </div>
          </div>
        </div>

        {/* ── Form Slide-over/Panel ─────────────────────────────── */}
        {(showForm || editing) && (
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-gray-200/90 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-base sm:text-lg font-extrabold font-heading text-gray-900">
                {showForm ? 'Add New Client Project' : `Edit: ${editing?.projectTitle}`}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditing(null)
                }}
                className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {showForm ? (
              <ProjectForm
                onSave={(data) => createMutation.mutate(data)}
                onCancel={() => setShowForm(false)}
                loading={createMutation.isPending}
              />
            ) : (
              <div className="space-y-8">
                <ProjectForm
                  initial={editing}
                  onSave={(data) => updateMutation.mutate({ id: editing.id, ...data })}
                  onCancel={() => setEditing(null)}
                  loading={updateMutation.isPending}
                  onAttachmentChange={handleAttachmentChange}
                />

                {/* Integrated Billing & Invoice Section for Existing Project (Bug fixed: projectId={editing.id}) */}
                <div className="pt-6 border-t border-gray-200">
                  <AdminBillingSection
                    projectId={editing.id}
                    clientProjectId={editing.id}
                    currentRole="ADMIN"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Client Portfolio Summary Banner (When Filtered by Client) ── */}
        {clientFilter !== 'ALL' && selectedClientProjects.length > 0 && (
          <div className="bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200/80 p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-brand-blue text-white flex items-center justify-center font-bold text-lg shadow-sm">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-gray-900">
                    Client Profile: {clientFilter}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-brand-blue border border-blue-200">
                    {selectedClientProjects.length} Projects
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-0.5">
                  Portfolio summary for client deliverables, active progress, and open issues.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-bold text-gray-700 shrink-0 flex-wrap">
              <div className="bg-white px-3 py-1.5 rounded-xl border border-blue-100 shadow-2xs">
                Active:{' '}
                <span className="text-brand-blue">
                  {selectedClientProjects.filter((p) => p.status !== 'COMPLETED').length}
                </span>
              </div>
              <div className="bg-white px-3 py-1.5 rounded-xl border border-blue-100 shadow-2xs">
                Completed:{' '}
                <span className="text-emerald-600">
                  {selectedClientProjects.filter((p) => p.status === 'COMPLETED').length}
                </span>
              </div>
              <div className="bg-white px-3 py-1.5 rounded-xl border border-blue-100 shadow-2xs">
                Avg Progress:{' '}
                <span className="text-purple-700 font-mono">
                  {Math.round(
                    selectedClientProjects.reduce((acc, p) => acc + (p.progress || 0), 0) /
                      selectedClientProjects.length
                  )}
                  %
                </span>
              </div>
              <button
                onClick={() => setClientFilter('ALL')}
                className="text-xs text-brand-blue hover:underline cursor-pointer"
              >
                Clear Client Filter &times;
              </button>
            </div>
          </div>
        )}

        {/* ── Search & Filter Controls ───────────────────────────── */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search title, client business, assigned staff, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Client Portfolio Filter */}
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none font-bold text-gray-700 shadow-xs cursor-pointer max-w-[160px]"
            >
              <option value="ALL">All Clients</option>
              {[...new Set(projects.map((p) => p.clientName))].map((cName) => (
                <option key={cName} value={cName}>
                  {cName}
                </option>
              ))}
            </select>

            {/* Project Type Filter */}
            <select
              value={projectTypeFilter}
              onChange={(e) => setProjectTypeFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none font-bold text-gray-700 shadow-xs cursor-pointer"
            >
              <option value="ALL">All Types</option>
              {PROJECT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {/* Health Filter */}
            <select
              value={healthFilter}
              onChange={(e) => setHealthFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none font-bold text-gray-700 shadow-xs cursor-pointer"
            >
              <option value="ALL">Health: All</option>
              <option value="ON_TRACK">● On Track</option>
              <option value="AT_RISK">● At Risk</option>
              <option value="DELAYED">● Delayed</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none font-bold text-gray-700 shadow-xs cursor-pointer"
            >
              <option value="ALL">Priority: All</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="px-3 py-2 text-xs font-bold text-brand-blue hover:text-blue-700 bg-blue-50 border border-blue-100 rounded-xl transition-all cursor-pointer"
              >
                Reset
              </button>
            )}

            {/* Status Filter Tabs */}
            <div className="flex overflow-x-auto gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200 shrink-0">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                All
              </button>
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    statusFilter === s
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main Projects Grid ─────────────────────────────────── */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white rounded-3xl border border-gray-200/80 h-56 animate-pulse shadow-sm"
              />
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-200/80 rounded-3xl shadow-xs">
            <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm font-bold">
              No client projects found matching current criteria.
            </p>
            <button
              onClick={resetFilters}
              className="mt-3 px-4 py-2 bg-blue-50 text-brand-blue text-xs font-bold rounded-xl hover:bg-blue-100 transition-all cursor-pointer"
            >
              Clear Search &amp; Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((p) => {
              const deadlineStatus = getDeadlineText(p.deadline, p.status)
              const projectOpenIssues = (p.issues || []).filter((i) => i.status !== 'RESOLVED').length
              const tasksDone = (p.tasks || []).filter((t) => t.status === 'DONE').length
              const totalTasks = (p.tasks || []).length
              const logsCount = (p.dailyLogs || []).length

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-3xl border border-gray-200/90 p-5 flex flex-col justify-between hover:shadow-lg hover:border-gray-300 hover:-translate-y-0.5 transition-all duration-200 relative group cursor-pointer"
                  onClick={() => setWorkspaceProject(p)}
                >
                  <div>
                    {/* Header tags: Status, Health & Priority */}
                    <div
                      className="flex items-center justify-between mb-3.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1.5">
                        <select
                          value={p.status}
                          onChange={(e) => updateMutation.mutate({ id: p.id, status: e.target.value })}
                          className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-lg border cursor-pointer focus:outline-none ${STATUS_COLORS[p.status]}`}
                          title="Click to quick update project status"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${HEALTH_COLORS[p.health || 'ON_TRACK']}`}>
                          ● {p.health === 'DELAYED' ? 'Delayed' : p.health === 'AT_RISK' ? 'At Risk' : 'On Track'}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${PRIORITY_COLORS[p.priority]}`}
                      >
                        {p.priority}
                      </span>
                    </div>

                    {/* Project Title */}
                    <h3 className="font-extrabold font-heading text-gray-900 group-hover:text-brand-blue transition-colors text-base line-clamp-1">
                      {p.projectTitle}
                    </h3>

                    {/* Client Name, Type & Portal Link Badge */}
                    <div className="flex items-center gap-1.5 flex-wrap text-xs text-gray-500 font-bold mb-3 mt-1">
                      <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{p.clientName}</span>
                      <span className="text-[10px] font-semibold text-gray-600 bg-gray-100 px-1.5 py-0.2 rounded border border-gray-200">
                        {p.projectType || 'Website'}
                      </span>
                      {p.client ? (
                        <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-1.5 py-0.5 rounded font-extrabold" title={`Linked to client portal account: ${p.client.email}`}>
                          Portal
                        </span>
                      ) : (
                        <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-bold" title="Portal account unlinked">
                          Unlinked
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center text-[11px] text-gray-500 font-bold mb-1">
                        <span>Progress</span>
                        <span className="text-gray-900 font-mono">{p.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-150">
                        <div
                          className="h-full bg-linear-to-r from-brand-blue to-indigo-600 transition-all duration-300 rounded-full"
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Project Intelligence Counters (Logs, Tasks, Issues, Vault) */}
                    <div className="flex items-center gap-1.5 flex-wrap mb-3 text-[10px] font-bold">
                      {logsCount > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-brand-blue border border-blue-100 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {logsCount} Logs
                        </span>
                      )}
                      {totalTasks > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100 flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          {tasksDone}/{totalTasks} Tasks
                        </span>
                      )}
                      {projectOpenIssues > 0 ? (
                        <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {projectOpenIssues} Issues
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          No Blockers
                        </span>
                      )}
                      {p.attachments && p.attachments.length > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 border border-gray-200 flex items-center gap-1">
                          📎 {p.attachments.length} Files
                        </span>
                      )}
                    </div>

                    {/* Timeline & Budget Info */}
                    <div className="grid grid-cols-2 gap-2 text-xs border-y border-gray-100 py-3 mb-3">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                        <div>
                          <p className="text-[9px] text-gray-400 font-extrabold uppercase leading-none mb-0.5">
                            Start Date
                          </p>
                          <p className="font-bold text-gray-800 leading-none font-mono">
                            {new Date(p.startDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                        <div>
                          <p className="text-[9px] text-gray-400 font-extrabold uppercase leading-none mb-0.5">
                            Deadline
                          </p>
                          <p className="font-bold text-gray-800 leading-none font-mono">
                            {new Date(p.deadline).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Team Lead & Budget Footer */}
                    <div className="flex items-center justify-between text-xs mb-3">
                      <div className="flex items-center gap-1 text-gray-700">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-bold truncate max-w-[130px]" title={`Assigned Staff: ${p.assignedTo}`}>
                          {p.assignedTo || 'Unassigned'}
                        </span>
                      </div>
                      {p.budget && (
                        <div className="flex items-center gap-1 text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                          <span>{p.budget}</span>
                        </div>
                      )}
                    </div>

                    {/* Deployment URLs quick links */}
                    {(p.liveUrl || p.stagingUrl || p.repoUrl) && (
                      <div
                        className="flex items-center gap-2 mb-3 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {p.liveUrl && (
                          <a
                            href={p.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-0.5 bg-blue-50 text-brand-blue hover:bg-blue-100 rounded-md text-[10px] font-bold flex items-center gap-1 border border-blue-100"
                            title="Open Live Website"
                          >
                            <Globe className="w-3 h-3" /> Live
                          </a>
                        )}
                        {p.stagingUrl && (
                          <a
                            href={p.stagingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-0.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-md text-[10px] font-bold flex items-center gap-1 border border-purple-100"
                            title="Open Staging/Test Environment"
                          >
                            <ExternalLink className="w-3 h-3" /> Staging
                          </a>
                        )}
                        {p.repoUrl && (
                          <a
                            href={p.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-0.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md text-[10px] font-bold flex items-center gap-1 border border-gray-200"
                            title="Open Git Code Repository"
                          >
                            <Code2 className="w-3 h-3" /> Git Repo
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Actions Footer */}
                  <div
                    className="flex items-center justify-between mt-2 pt-3 border-t border-gray-100 flex-wrap gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border ${deadlineStatus.color}`}
                    >
                      {deadlineStatus.text}
                    </span>

                    <div className="flex items-center gap-1">
                      {p.client && (
                        <button
                          onClick={() => {
                            setResendConfirm({
                              isOpen: true,
                              clientId: p.client.id,
                              email: p.client.email,
                            })
                          }}
                          className="text-gray-400 hover:text-emerald-600 p-1.5 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer"
                          title="Resend Portal Welcome Credentials Email"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => setWorkspaceProject(p)}
                        className="text-gray-400 hover:text-brand-blue p-1.5 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                        title="Open 360° Project Intelligence & Daily Work Logs"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditing(p)
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        className="text-gray-400 hover:text-brand-blue p-1.5 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                        title="Edit Project"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(p)}
                        className="text-gray-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                        title="Delete Project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── 360° Project Intelligence Workspace Drawer ─────────── */}
      {workspaceProject && (
        <ProjectWorkspaceDrawer
          project={workspaceProject}
          onClose={() => setWorkspaceProject(null)}
          onEditFull={(p) => {
            setEditing(p)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          assignableTeam={assignableTeam}
        />
      )}

      {/* ── Executive Boss / Management Reporting Modal ─────────── */}
      <BossReportModal
        isOpen={showBossReport}
        onClose={() => setShowBossReport(false)}
        projects={projects}
        clients={clients}
      />

      {/* ── Confirmation Modals ──────────────────────────────────── */}
      {/* 1. Delete Project Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null, title: '' })}
        onConfirm={() => {
          if (deleteConfirm.id) {
            deleteMutation.mutate(deleteConfirm.id)
            setDeleteConfirm({ isOpen: false, id: null, title: '' })
          }
        }}
        title="Delete Client Project"
        message="Are you sure you want to permanently delete this client project? This will also cascade delete all linked tasks and deliverables."
        itemTitle={deleteConfirm.title}
        confirmText="Delete Project"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      {/* 2. Resend Welcome Email Modal */}
      <ConfirmModal
        isOpen={resendConfirm.isOpen}
        onClose={() => setResendConfirm({ isOpen: false, clientId: null, email: '' })}
        onConfirm={() => {
          if (resendConfirm.clientId) {
            resendCredentialsMutation.mutate(resendConfirm.clientId)
            setResendConfirm({ isOpen: false, clientId: null, email: '' })
          }
        }}
        title="Resend Client Credentials Email"
        message="Send client portal login credentials and welcome instructions to the linked client email account?"
        itemTitle={resendConfirm.email}
        confirmText="Send Email"
        variant="info"
        isLoading={resendCredentialsMutation.isPending}
      />
    </>
  )
}
