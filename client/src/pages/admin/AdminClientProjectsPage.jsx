/**
 * AdminClientProjectsPage.jsx — Client Projects Tracker & Vault
 * Streamlined project management, team attribution, client linking, deliverables vault, SLA tracking, and Boss (Excel/PDF) reporting.
 */
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Search,
  User,
  Tag,
  Clock,
  FolderOpen,
  Eye,
  FileCheck,
  RefreshCw,
  Send,
  Building2,
  FileSpreadsheet,
  Globe,
  ExternalLink,
  Code2,
  Layers,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { api } from '@/utils/api'
import { SEO, ConfirmModal } from '@/components/ui'
import AttachmentSection from '@/components/ui/AttachmentSection'
import AdminBillingSection from '@/components/admin/AdminBillingSection'
import BossReportModal from '@/components/admin/BossReportModal'
import { useToast } from '@/components/ui/ToastProvider'

const STATUSES = ['PLANNING', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'ON_HOLD']
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

const PROJECT_TYPES = [
  { id: 'WEBSITE', label: 'Website Development' },
  { id: 'WEB_APP', label: 'Web Application' },
  { id: 'MOBILE_APP', label: 'Mobile Application' },
  { id: 'PORTAL', label: 'Client Portal' },
  { id: 'ADMIN_PANEL', label: 'Admin Panel' },
  { id: 'ECOMMERCE', label: 'E-Commerce Website' },
  { id: 'BACKEND_API', label: 'API / Backend' },
  { id: 'MAINTENANCE', label: 'Maintenance & Support' },
  { id: 'CUSTOM', label: 'Other Custom Project' },
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

const HEALTH_LABELS = {
  ON_TRACK: '🟢 On Track',
  AT_RISK: '🟡 At Risk',
  DELAYED: '🔴 Delayed',
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
          projectType: initial.projectType || 'CUSTOM',
          health: initial.health || 'ON_TRACK',
          liveUrl: initial.liveUrl || '',
          stagingUrl: initial.stagingUrl || '',
          repoUrl: initial.repoUrl || '',
          credentialsNotes: initial.credentialsNotes || '',
        }
      : {
          clientName: '',
          projectTitle: '',
          projectType: 'WEBSITE',
          health: 'ON_TRACK',
          description: '',
          startDate: formatDateForInput(new Date()),
          deadline: '',
          assignedTo: '',
          assignedToEmail: '',
          budget: '',
          tags: '',
          notes: '',
          liveUrl: '',
          stagingUrl: '',
          repoUrl: '',
          credentialsNotes: '',
          status: 'PLANNING',
          priority: 'MEDIUM',
          progress: 0,
          clientId: '',
        },
  })

  const watchedProgress = watch('progress') || 0

  const onSubmit = (data) => {
    const payload = {
      projectTitle: data.projectTitle,
      clientName: data.clientName,
      projectType: data.projectType || 'CUSTOM',
      health: data.health || 'ON_TRACK',
      description: data.description || '',
      startDate: data.startDate,
      deadline: data.deadline,
      assignedTo: data.assignedTo || '',
      assignedToEmail: data.assignedToEmail || '',
      budget: data.budget || '',
      liveUrl: data.liveUrl || '',
      stagingUrl: data.stagingUrl || '',
      repoUrl: data.repoUrl || '',
      credentialsNotes: data.credentialsNotes || '',
      notes: data.notes || '',
      status: data.status || 'PLANNING',
      priority: data.priority || 'MEDIUM',
      progress: parseInt(data.progress || 0),
      clientId: data.clientId || null,
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-gray-700 block mb-1.5">
              Project Title *
            </label>
            <input
              {...register('projectTitle', { required: true })}
              className={inputCls}
              placeholder="e.g. Corporate Website & Client Portal"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">
              Project Type
            </label>
            <select {...register('projectType')} className={inputCls}>
              {PROJECT_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
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
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">
              Assigned Staff / Team Member
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
          <span>💵</span> 2. Financial Budget &amp; Project Schedule
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
            <label className="text-xs font-bold text-gray-700 block mb-1.5">Priority Level</label>
            <select {...register('priority')} className={inputCls}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Section 3: Status, Health & Progress */}
      <div className="bg-gray-50/60 p-5 rounded-2xl border border-gray-200/80 space-y-4">
        <p className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-2">
          <span>📈</span> 3. Lifecycle Status, Health &amp; Progress
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
            <label className="text-xs font-bold text-gray-700 block mb-1.5">Project Health</label>
            <select {...register('health')} className={inputCls}>
              <option value="ON_TRACK">🟢 On Track</option>
              <option value="AT_RISK">🟡 At Risk</option>
              <option value="DELAYED">🔴 Delayed</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">
              Tags (Comma Separated)
            </label>
            <input {...register('tags')} className={inputCls} placeholder="React, Node, UI/UX" />
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
                <span className="px-2.5 py-0.5 rounded-full bg-brand-blue text-white font-mono font-bold text-[11px] ml-1 shadow-xs">
                  {watchedProgress}%
                </span>
              </div>
            </div>

            <div className="relative pt-1">
              <div className="overflow-hidden h-3 text-xs flex rounded-full bg-gray-100 border border-gray-200 shadow-inner">
                <div
                  style={{ width: `${watchedProgress}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-brand-blue transition-all duration-300 rounded-full"
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

      {/* Section 4: Live, Staging & Repository URLs */}
      <div className="bg-gray-50/60 p-5 rounded-2xl border border-gray-200/80 space-y-4">
        <p className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-2">
          <span>🔗</span> 4. Deployment URLs &amp; Git Repository
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-blue-500" /> Live Website URL
            </label>
            <input {...register('liveUrl')} className={inputCls} placeholder="https://clientdomain.com" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5 flex items-center gap-1">
              <ExternalLink className="w-3.5 h-3.5 text-amber-500" /> Staging URL
            </label>
            <input {...register('stagingUrl')} className={inputCls} placeholder="https://staging.clientdomain.com" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5 flex items-center gap-1">
              <Code2 className="w-3.5 h-3.5 text-purple-500" /> Repository URL
            </label>
            <input {...register('repoUrl')} className={inputCls} placeholder="https://github.com/org/repo" />
          </div>
        </div>
      </div>

      {/* Section 5: Description, Credentials & Confidential Notes */}
      <div className="bg-gray-50/60 p-5 rounded-2xl border border-gray-200/80 space-y-4">
        <p className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-2">
          <span>📝</span> 5. Project Brief &amp; Confidential Internal Notes
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">
              Client-Visible Project Brief / Scope
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
              Confidential Internal Admin Notes / Credentials
            </label>
            <textarea
              rows={3}
              {...register('notes')}
              className={`${inputCls} resize-none bg-amber-50/30 border-amber-200/60 focus:bg-white`}
              placeholder="Internal credentials, hosting access, payment agreements, team notes..."
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
  const [clientFilter, setClientFilter] = useState('ALL')
  const [quickViewProject, setQuickViewProject] = useState(null)
  const [showBossReportModal, setShowBossReportModal] = useState(false)

  // In-modal task creation
  const [newTaskTitle, setNewTaskTitle] = useState('')

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
    queryKey: ['admin-clients-list-for-dropdown'],
    queryFn: () => api.get('/admin/clients').then((r) => r.data),
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
      toast.error(err.response?.data?.message || 'Failed to delete project')
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

  // Task mutation inside Quick View Modal
  const createTaskMutation = useMutation({
    mutationFn: ({ projectId, title }) =>
      api.post(`/admin/client-projects/${projectId}/tasks`, { title, priority: 'MEDIUM' }),
    onSuccess: (res) => {
      toast.success('Task added to project!')
      setNewTaskTitle('')
      qc.invalidateQueries({ queryKey: ['admin-client-projects'] })
      if (quickViewProject) {
        setQuickViewProject((prev) => ({
          ...prev,
          tasks: [...(prev.tasks || []), res.data.data],
        }))
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to add task.')
    },
  })

  const toggleTaskMutation = useMutation({
    mutationFn: ({ taskId, status }) =>
      api.patch(`/admin/tasks/${taskId}`, { status }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['admin-client-projects'] })
      if (quickViewProject) {
        setQuickViewProject((prev) => ({
          ...prev,
          tasks: (prev.tasks || []).map((t) =>
            t.id === variables.taskId ? { ...t, status: variables.status } : t
          ),
        }))
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update task.')
    },
  })

  const handleAttachmentChange = () => {
    qc.invalidateQueries({ queryKey: ['admin-client-projects'] })
  }

  // Summary statistics
  const stats = useMemo(() => {
    const total = projects.length
    const active = projects.filter((p) => p.status === 'IN_PROGRESS' || p.status === 'PLANNING').length
    const completed = projects.filter((p) => p.status === 'COMPLETED').length
    const overdue = projects.filter((p) => {
      if (!p.deadline || p.status === 'COMPLETED') return false
      return new Date(p.deadline) < new Date()
    }).length
    return { total, active, completed, overdue }
  }, [projects])

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        searchTerm === '' ||
        p.projectTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())))

      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter
      const matchesPriority = priorityFilter === 'ALL' || p.priority === priorityFilter
      const matchesClient = clientFilter === 'ALL' || p.clientId === clientFilter || p.clientName === clientFilter

      return matchesSearch && matchesStatus && matchesPriority && matchesClient
    })
  }, [projects, searchTerm, statusFilter, priorityFilter, clientFilter])

  const calculateDaysLeft = (deadlineStr) => {
    if (!deadlineStr) return { text: 'No SLA Date', color: 'bg-gray-100 text-gray-500 border-gray-200' }
    const deadline = new Date(deadlineStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    deadline.setHours(0, 0, 0, 0)
    const diffTime = deadline - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return { text: `Overdue by ${Math.abs(diffDays)}d`, color: 'bg-rose-50 text-rose-700 border-rose-200 font-bold' }
    }
    if (diffDays === 0) {
      return { text: 'Due Today', color: 'bg-orange-50 text-orange-700 border-orange-200 font-bold animate-pulse' }
    }
    if (diffDays <= 3) {
      return { text: `Due in ${diffDays}d`, color: 'bg-amber-50 text-amber-700 border-amber-200 font-semibold' }
    }
    return { text: `${diffDays} days left`, color: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium' }
  }

  const handleDeleteClick = (project) => {
    setDeleteConfirm({
      isOpen: true,
      id: project.id,
      title: project.projectTitle,
    })
  }

  return (
    <>
      <SEO
        title="Client Projects Tracker & Vault — Admin"
        description="Enterprise client project tracking, deliverables vault, SLA deadlines, and executive management reporting."
      />

      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* ── Top Header Section ─────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/80 pb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold font-heading text-gray-900 tracking-tight flex items-center gap-2.5">
              <span className="p-2 bg-brand-blue/10 text-brand-blue rounded-xl">
                <FolderOpen className="w-5 h-5 sm:w-6 sm:h-6" />
              </span>
              Client Projects Tracker &amp; Vault
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Manage client projects, track deliverables, team attributions, and generate Boss reports for leadership.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => refetch()}
              className="p-2.5 text-gray-500 hover:text-brand-blue hover:bg-blue-50 rounded-xl border border-gray-200/80 transition-all cursor-pointer bg-white"
              title="Refresh Projects"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Boss Reports Button */}
            <button
              onClick={() => setShowBossReportModal(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 hover:-translate-y-0.5 transition-all cursor-pointer"
              title="Export Executive Report to Excel (CSV) or Print PDF"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Boss Reports (Excel / PDF)</span>
            </button>

            {/* Add New Project Button */}
            <button
              onClick={() => {
                setEditing(null)
                setShowForm(!showForm)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="flex items-center gap-2 bg-brand-blue hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-brand-blue/20 hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{showForm ? 'Close Form' : 'Add Project'}</span>
            </button>
          </div>
        </div>

        {/* ── Summary Metric Stats Row ────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4.5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-3.5 hover:shadow-sm transition-shadow">
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

          <div className="bg-white p-4.5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-3.5 hover:shadow-sm transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-blue border border-blue-100 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Projects</p>
              <p className="text-xl font-extrabold font-heading text-brand-blue">
                {isLoading ? '…' : stats.active}
              </p>
            </div>
          </div>

          <div className="bg-white p-4.5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-3.5 hover:shadow-sm transition-shadow">
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

          <div className="bg-white p-4.5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-3.5 hover:shadow-sm transition-shadow">
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

                {/* Integrated Billing & Invoice Section for Existing Project */}
                <div className="pt-6 border-t border-gray-200">
                  <AdminBillingSection clientProjectId={editing.id} projectId={editing.id} clientProject={editing} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Search & Filter Controls ───────────────────────────── */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects by title, client name, description, tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Client Filter */}
              <select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="px-3 py-2 text-xs font-semibold border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none"
              >
                <option value="ALL">All Clients ({clients.length})</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs font-semibold border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 text-xs font-semibold border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none"
              >
                <option value="ALL">All Priorities</option>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              {(searchTerm || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || clientFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('ALL')
                    setPriorityFilter('ALL')
                    setClientFilter('ALL')
                  }}
                  className="px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-100 font-semibold transition-all cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Client Filter Banner if specific client is selected */}
          {clientFilter !== 'ALL' && (
            <div className="bg-blue-50/70 border border-blue-200/80 px-3.5 py-2 rounded-xl flex items-center justify-between text-xs text-brand-blue font-medium">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                Filtered by client:{' '}
                <strong>
                  {clients.find((c) => c.id === clientFilter)?.name || clientFilter}
                </strong>{' '}
                ({filteredProjects.length} project{filteredProjects.length === 1 ? '' : 's'})
              </span>
              <button
                onClick={() => setClientFilter('ALL')}
                className="text-[11px] underline hover:text-blue-800 cursor-pointer font-bold"
              >
                Show All
              </button>
            </div>
          )}
        </div>

        {/* ── Project Cards Grid ─────────────────────────────────── */}
        {isLoading ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-200/80 shadow-xs">
            <RefreshCw className="w-8 h-8 text-brand-blue animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-700">Loading client projects &amp; deliverables...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-200/80 shadow-xs space-y-3">
            <FolderOpen className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="text-base font-bold text-gray-800">No projects found</p>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'ALL' || clientFilter !== 'ALL'
                ? 'Try adjusting your filters or search keywords.'
                : 'Click "Add Project" to start tracking your first client project.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((p) => {
              const deadlineStatus = calculateDaysLeft(p.deadline)
              const typeObj = PROJECT_TYPES.find((t) => t.id === p.projectType) || { label: p.projectType || 'Custom' }
              const tasksDone = (p.tasks || []).filter((t) => t.status === 'COMPLETED').length
              const totalTasks = (p.tasks || []).length

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-gray-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between p-5 group hover:border-brand-blue/40"
                >
                  <div>
                    {/* Header Row: Title, Priority, Status */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <h3
                          onClick={() => setQuickViewProject(p)}
                          className="font-extrabold font-heading text-sm sm:text-base text-gray-900 truncate hover:text-brand-blue transition-colors cursor-pointer"
                          title={p.projectTitle}
                        >
                          {p.projectTitle}
                        </h3>
                        <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-gray-400 shrink-0" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (p.clientId) setClientFilter(p.clientId)
                            }}
                            className="font-bold text-gray-700 hover:text-brand-blue truncate max-w-[170px] text-left underline decoration-gray-300 hover:decoration-brand-blue"
                            title={`Filter projects by ${p.clientName}`}
                          >
                            {p.clientName}
                          </button>
                          {p.client && (
                            <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-1 rounded font-bold shrink-0">
                              Portal Linked
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                            PRIORITY_COLORS[p.priority] || PRIORITY_COLORS.MEDIUM
                          }`}
                        >
                          {p.priority}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                            STATUS_COLORS[p.status] || STATUS_COLORS.PLANNING
                          }`}
                        >
                          {STATUS_LABELS[p.status] || p.status}
                        </span>
                      </div>
                    </div>

                    {/* Sub-Badges Row: Project Type & Health */}
                    <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                      <span className="text-[10px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md border border-gray-200">
                        {typeObj.label}
                      </span>
                      {p.health && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            HEALTH_COLORS[p.health] || HEALTH_COLORS.ON_TRACK
                          }`}
                        >
                          {HEALTH_LABELS[p.health] || p.health}
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1 mb-3">
                      <div className="flex justify-between text-[11px] font-semibold">
                        <span className="text-gray-500">Progress</span>
                        <span className="font-mono font-bold text-gray-900">{p.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-200/60">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${
                            p.progress === 100
                              ? 'bg-emerald-500'
                              : p.progress >= 50
                              ? 'bg-brand-blue'
                              : 'bg-indigo-500'
                          }`}
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Assigned Staff & Budget Row */}
                    <div className="flex items-center justify-between text-xs mb-3 bg-gray-50/60 p-2 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-1.5 text-gray-700 min-w-0">
                        <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-bold text-[11px] truncate text-gray-900">
                            {p.assignedTo || 'Unassigned'}
                          </p>
                          {p.assignedToEmail && (
                            <a
                              href={`mailto:${p.assignedToEmail}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-[10px] text-gray-400 hover:text-brand-blue truncate block"
                            >
                              {p.assignedToEmail}
                            </a>
                          )}
                        </div>
                      </div>
                      {p.budget && (
                        <div className="text-[11px] text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 shrink-0">
                          {p.budget}
                        </div>
                      )}
                    </div>

                    {/* Deployment URLs (Live, Staging, Repo) */}
                    {(p.liveUrl || p.stagingUrl || p.repoUrl) && (
                      <div className="flex items-center gap-1.5 mb-3 flex-wrap text-[10px]">
                        {p.liveUrl && (
                          <a
                            href={p.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="px-2 py-0.5 bg-blue-50 text-brand-blue hover:bg-blue-100 rounded-md border border-blue-200 flex items-center gap-1 font-semibold transition-all"
                            title={`Open Live Site: ${p.liveUrl}`}
                          >
                            <Globe className="w-2.5 h-2.5" />
                            Live Site
                          </a>
                        )}
                        {p.stagingUrl && (
                          <a
                            href={p.stagingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="px-2 py-0.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-md border border-amber-200 flex items-center gap-1 font-semibold transition-all"
                            title={`Open Staging: ${p.stagingUrl}`}
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            Staging
                          </a>
                        )}
                        {p.repoUrl && (
                          <a
                            href={p.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="px-2 py-0.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-md border border-purple-200 flex items-center gap-1 font-semibold transition-all"
                            title={`Open Repo: ${p.repoUrl}`}
                          >
                            <Code2 className="w-2.5 h-2.5" />
                            Git Repo
                          </a>
                        )}
                      </div>
                    )}

                    {/* Brief Description */}
                    {p.description && (
                      <p className="text-[11px] text-gray-600 line-clamp-2 bg-gray-50/50 p-2 rounded-xl border border-gray-100 mb-2 font-sans">
                        {p.description}
                      </p>
                    )}

                    {/* Tags */}
                    {p.tags && p.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {p.tags.map((t) => (
                          <span
                            key={t}
                            className="text-[9px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 border border-gray-200"
                          >
                            <Tag className="w-2 h-2 text-gray-400" />
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Actions Footer */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border ${deadlineStatus.color}`}
                      >
                        {deadlineStatus.text}
                      </span>
                      {p.attachments && p.attachments.length > 0 && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-blue-50 text-brand-blue border border-blue-100 flex items-center gap-1"
                          title="Files in Project Vault"
                        >
                          📎 {p.attachments.length}
                        </span>
                      )}
                      {totalTasks > 0 && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-100 flex items-center gap-1"
                          title="Tasks Completed / Total"
                        >
                          <Layers className="w-2.5 h-2.5" />
                          {tasksDone}/{totalTasks}
                        </span>
                      )}
                    </div>

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
                        onClick={() => setQuickViewProject(p)}
                        className="text-gray-400 hover:text-brand-blue p-1.5 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                        title="View Full Project Details & Vault"
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

      {/* ── Quick View & Management Modal ─────────────────────── */}
      {quickViewProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto border border-gray-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-brand-blue/10 text-brand-blue rounded-2xl shrink-0 mt-1">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg sm:text-xl font-extrabold font-heading text-gray-900">
                      {quickViewProject.projectTitle}
                    </h3>
                    <span
                      className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        STATUS_COLORS[quickViewProject.status]
                      }`}
                    >
                      {STATUS_LABELS[quickViewProject.status]}
                    </span>
                    {quickViewProject.health && (
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                          HEALTH_COLORS[quickViewProject.health] || HEALTH_COLORS.ON_TRACK
                        }`}
                      >
                        {HEALTH_LABELS[quickViewProject.health] || quickViewProject.health}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1 font-semibold text-gray-700">
                      <Building2 className="w-3.5 h-3.5 text-gray-400" />
                      Client: <strong>{quickViewProject.clientName}</strong>
                    </span>
                    {quickViewProject.client && (
                      <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded font-bold">
                        Portal Account Linked
                      </span>
                    )}
                    <span className="text-gray-300">•</span>
                    <span className="flex items-center gap-1 text-gray-600 font-medium">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      Assigned: <strong>{quickViewProject.assignedTo || 'Unassigned'}</strong>
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setQuickViewProject(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick KPI Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200/80">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Budget</p>
                <p className="text-lg font-black text-gray-900 mt-0.5">{quickViewProject.budget || '₹ Custom'}</p>
              </div>
              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200/80">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Progress</p>
                <p className="text-lg font-black text-brand-blue mt-0.5">{quickViewProject.progress}%</p>
              </div>
              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200/80">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Start Date</p>
                <p className="text-xs font-bold text-gray-800 mt-1">
                  {quickViewProject.startDate ? new Date(quickViewProject.startDate).toLocaleDateString('en-IN') : 'N/A'}
                </p>
              </div>
              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200/80">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Deadline</p>
                <p className="text-xs font-bold text-gray-800 mt-1">
                  {quickViewProject.deadline ? new Date(quickViewProject.deadline).toLocaleDateString('en-IN') : 'N/A'}
                </p>
              </div>
            </div>

            {/* Deployment & Repository Links */}
            {(quickViewProject.liveUrl || quickViewProject.stagingUrl || quickViewProject.repoUrl) && (
              <div className="flex items-center gap-2 flex-wrap bg-blue-50/40 p-3 rounded-2xl border border-blue-100 text-xs">
                <span className="font-bold text-gray-700 mr-1 flex items-center gap-1">
                  <span>🔗</span> Project Links:
                </span>
                {quickViewProject.liveUrl && (
                  <a
                    href={quickViewProject.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-white text-brand-blue hover:bg-blue-50 rounded-xl border border-blue-200 font-bold flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Visit Live Site
                  </a>
                )}
                {quickViewProject.stagingUrl && (
                  <a
                    href={quickViewProject.stagingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-white text-amber-700 hover:bg-amber-50 rounded-xl border border-amber-200 font-bold flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Staging Server
                  </a>
                )}
                {quickViewProject.repoUrl && (
                  <a
                    href={quickViewProject.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-white text-purple-700 hover:bg-purple-50 rounded-xl border border-purple-200 font-bold flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    GitHub Repository
                  </a>
                )}
              </div>
            )}

            {/* Scope & Confidential Notes */}
            {quickViewProject.description && (
              <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-200 space-y-1">
                <p className="text-xs font-bold text-gray-700">Project Overview &amp; Scope:</p>
                <p className="text-xs text-gray-600 leading-relaxed">{quickViewProject.description}</p>
              </div>
            )}

            {quickViewProject.notes && (
              <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/70 space-y-1">
                <p className="text-xs font-bold text-amber-900">Confidential Internal Notes / Credentials:</p>
                <p className="text-xs text-amber-800 leading-relaxed whitespace-pre-wrap">{quickViewProject.notes}</p>
              </div>
            )}

            {/* In-Project Tasks Section */}
            <div className="space-y-3 bg-white p-4.5 rounded-2xl border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600" />
                  Deliverables &amp; Tasks ({(quickViewProject.tasks || []).length})
                </h4>
              </div>

              {/* Task Add Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a new deliverable task and press Enter..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newTaskTitle.trim()) {
                      createTaskMutation.mutate({
                        projectId: quickViewProject.id,
                        title: newTaskTitle.trim(),
                      })
                    }
                  }}
                  className="flex-1 px-3.5 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                />
                <button
                  type="button"
                  disabled={!newTaskTitle.trim() || createTaskMutation.isPending}
                  onClick={() => {
                    if (newTaskTitle.trim()) {
                      createTaskMutation.mutate({
                        projectId: quickViewProject.id,
                        title: newTaskTitle.trim(),
                      })
                    }
                  }}
                  className="px-4 py-2 bg-brand-blue text-white rounded-xl text-xs font-bold hover:bg-blue-600 disabled:opacity-50 transition-all cursor-pointer"
                >
                  Add Task
                </button>
              </div>

              {/* Tasks List */}
              {(!quickViewProject.tasks || quickViewProject.tasks.length === 0) ? (
                <p className="text-xs text-gray-400 bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                  No tasks tracked yet. Add deliverables above to track progress.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {quickViewProject.tasks.map((task) => {
                    const isDone = task.status === 'COMPLETED'
                    return (
                      <div
                        key={task.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                          isDone
                            ? 'bg-emerald-50/50 border-emerald-200/80 text-gray-500'
                            : 'bg-gray-50/50 border-gray-200 text-gray-800'
                        }`}
                      >
                        <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={isDone}
                            onChange={() =>
                              toggleTaskMutation.mutate({
                                taskId: task.id,
                                status: isDone ? 'TODO' : 'COMPLETED',
                              })
                            }
                            className="rounded border-gray-300 text-brand-blue focus:ring-brand-blue cursor-pointer"
                          />
                          <span className={`truncate font-medium ${isDone ? 'line-through text-gray-400' : ''}`}>
                            {task.title}
                          </span>
                        </label>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ml-2 ${
                            isDone
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}
                        >
                          {isDone ? 'Done' : 'Pending'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Project Vault File Assets */}
            <div className="space-y-3 bg-white p-4.5 rounded-2xl border border-gray-200 shadow-xs">
              <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-brand-blue" />
                Project Vault Files &amp; Documents ({quickViewProject.attachments?.length || 0})
              </h4>
              <AttachmentSection
                attachments={quickViewProject.attachments || []}
                clientProjectId={quickViewProject.id}
                onUploadSuccess={() => {
                  qc.invalidateQueries({ queryKey: ['admin-client-projects'] })
                }}
              />
            </div>

            {/* Milestone Billing Section */}
            <div className="space-y-3 bg-white p-4.5 rounded-2xl border border-gray-200 shadow-xs">
              <AdminBillingSection
                clientProjectId={quickViewProject.id}
                projectId={quickViewProject.id}
                clientProject={quickViewProject}
              />
            </div>

            {/* Modal Footer Controls */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={() => {
                  setEditing(quickViewProject)
                  setQuickViewProject(null)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="px-4 py-2 bg-brand-blue text-white text-xs font-bold rounded-xl hover:bg-blue-600 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit Full Project Details
              </button>
              <button
                onClick={() => setQuickViewProject(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Boss Report Modal ────────────────────────────────────── */}
      <BossReportModal
        isOpen={showBossReportModal}
        onClose={() => setShowBossReportModal(false)}
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
