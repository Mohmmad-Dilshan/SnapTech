/**
 * ProjectWorkspaceDrawer.jsx — 360° Project Intelligence & Daily Work Management Workspace
 * Comprehensive tabbed workspace for:
 * 1. Overview & Links (Live, Staging, Repo, Credentials)
 * 2. Daily Work Logs (Today's Work, Features, Bugs, Blockers, Tomorrow's Plan, Hours)
 * 3. Tasks & Deliverables (In-project tasks with Auto Progress Calculator)
 * 4. Bugs & Issues Tracker (Severity, Type, Resolution)
 * 5. Features Pipeline (Planned, In Progress, Released)
 * 6. Project Vault (Categorized Documents & Previews)
 * 7. Milestone Billing (Invoices & Deliverables)
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  X,
  Pencil,
  Check,
  Plus,
  Trash2,
  Calendar,
  Clock,
  User,
  DollarSign,
  Globe,
  ExternalLink,
  Code2,
  Lock,
  Tag,
  FolderOpen,
  FileText,
  AlertTriangle,
  Bug,
  Sparkles,
  CheckCircle2,
  Layers,
  Paperclip,
  Landmark,
  Calculator,
  Send,
  Loader2,
  ShieldAlert,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { api } from '@/utils/api'
import { useToast } from '@/components/ui/ToastProvider'
import AttachmentSection from '@/components/ui/AttachmentSection'
import AdminBillingSection from '@/components/admin/AdminBillingSection'
import ConfirmModal from '@/components/ui/ConfirmModal'

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

const HEALTH_COLORS = {
  ON_TRACK: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  AT_RISK: 'bg-amber-50 text-amber-700 border-amber-200 font-bold',
  DELAYED: 'bg-rose-50 text-rose-700 border-rose-200 font-bold ring-1 ring-rose-500/20',
}

export default function ProjectWorkspaceDrawer({
  project,
  onClose,
  onEditFull,
  assignableTeam = [],
}) {
  const qc = useQueryClient()
  const toast = useToast()

  const [activeTab, setActiveTab] = useState('overview') // overview | dailyLogs | tasks | issues | features | vault | billing
  const [showAddLog, setShowAddLog] = useState(false)
  const [showAddIssue, setShowAddIssue] = useState(false)
  const [showAddFeature, setShowAddFeature] = useState(false)
  const [showAddTask, setShowAddTask] = useState(false)

  // Modals
  const [confirmDeleteLog, setConfirmDeleteLog] = useState({ isOpen: false, id: null })
  const [confirmDeleteIssue, setConfirmDeleteIssue] = useState({ isOpen: false, id: null, title: '' })
  const [confirmDeleteFeature, setConfirmDeleteFeature] = useState({ isOpen: false, id: null, name: '' })

  // Active Project Data Query (keeps drawer real-time)
  const { data: currentProject = project, refetch: refetchProject } = useQuery({
    queryKey: ['admin-client-project', project.id],
    queryFn: () => api.get('/admin/client-projects').then((r) => r.data.find((p) => p.id === project.id) || project),
    initialData: project,
  })

  // ── 1. DAILY LOG MUTATIONS ──────────────────────────────────────
  const { register: regLog, handleSubmit: handleLogSubmit, reset: resetLog, formState: { isSubmitting: logSubmitting } } = useForm({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      workDone: '',
      featuresAdded: '',
      bugsFixed: '',
      issuesEncountered: '',
      pendingWork: '',
      nextDayPlan: '',
      timeSpentHours: '',
    },
  })

  const createLogMutation = useMutation({
    mutationFn: (data) => api.post(`/admin/client-projects/${project.id}/daily-logs`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-client-projects'] })
      qc.invalidateQueries({ queryKey: ['admin-client-project', project.id] })
      qc.invalidateQueries({ queryKey: ['admin-boss-report'] })
      setShowAddLog(false)
      resetLog()
      toast.success('Daily work log added successfully!')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add work log.'),
  })

  const deleteLogMutation = useMutation({
    mutationFn: (logId) => api.delete(`/admin/daily-logs/${logId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-client-projects'] })
      qc.invalidateQueries({ queryKey: ['admin-client-project', project.id] })
      toast.info('Daily log removed.')
    },
  })

  // ── 2. TASKS & PROGRESS CALCULATION ─────────────────────────────
  const { register: regTask, handleSubmit: handleTaskSubmit, reset: resetTask, formState: { isSubmitting: taskSubmitting } } = useForm({
    defaultValues: {
      title: '',
      priority: 'MEDIUM',
      dueDate: '',
      assignedTo: currentProject.assignedTo || '',
    },
  })

  const createTaskMutation = useMutation({
    mutationFn: (data) => api.post('/admin/tasks', { ...data, clientProjectId: project.id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-client-projects'] })
      qc.invalidateQueries({ queryKey: ['admin-client-project', project.id] })
      qc.invalidateQueries({ queryKey: ['admin-tasks'] })
      setShowAddTask(false)
      resetTask()
      toast.success('Project task created!')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create task.'),
  })

  const updateTaskStatusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/admin/tasks/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-client-projects'] })
      qc.invalidateQueries({ queryKey: ['admin-client-project', project.id] })
      qc.invalidateQueries({ queryKey: ['admin-tasks'] })
    },
  })

  const autoCalculateProgress = () => {
    const tasks = currentProject.tasks || []
    if (tasks.length === 0) {
      toast.info('No tasks found in project to calculate progress.')
      return
    }
    const completed = tasks.filter((t) => t.status === 'DONE').length
    const calculatedPercentage = Math.round((completed / tasks.length) * 100)

    api.patch(`/admin/client-projects/${project.id}`, { progress: calculatedPercentage }).then(() => {
      qc.invalidateQueries({ queryKey: ['admin-client-projects'] })
      qc.invalidateQueries({ queryKey: ['admin-client-project', project.id] })
      toast.success(`Progress updated to ${calculatedPercentage}% based on ${completed}/${tasks.length} completed tasks!`)
    })
  }

  // ── 3. ISSUES & BUGS MUTATIONS ──────────────────────────────────
  const { register: regIssue, handleSubmit: handleIssueSubmit, reset: resetIssue, formState: { isSubmitting: issueSubmitting } } = useForm({
    defaultValues: {
      title: '',
      description: '',
      issueType: 'BUG',
      severity: 'HIGH',
      assignedTo: currentProject.assignedTo || '',
    },
  })

  const createIssueMutation = useMutation({
    mutationFn: (data) => api.post(`/admin/client-projects/${project.id}/issues`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-client-projects'] })
      qc.invalidateQueries({ queryKey: ['admin-client-project', project.id] })
      setShowAddIssue(false)
      resetIssue()
      toast.success('Issue recorded!')
    },
  })

  const updateIssueMutation = useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/admin/issues/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-client-projects'] })
      qc.invalidateQueries({ queryKey: ['admin-client-project', project.id] })
      toast.success('Issue status updated!')
    },
  })

  const deleteIssueMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/issues/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-client-projects'] })
      qc.invalidateQueries({ queryKey: ['admin-client-project', project.id] })
      toast.info('Issue removed.')
    },
  })

  // ── 4. FEATURES MUTATIONS ───────────────────────────────────────
  const { register: regFeature, handleSubmit: handleFeatureSubmit, reset: resetFeature, formState: { isSubmitting: featureSubmitting } } = useForm({
    defaultValues: {
      name: '',
      description: '',
      requestedBy: currentProject.clientName || 'Client',
      status: 'PLANNED',
    },
  })

  const createFeatureMutation = useMutation({
    mutationFn: (data) => api.post(`/admin/client-projects/${project.id}/features`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-client-projects'] })
      qc.invalidateQueries({ queryKey: ['admin-client-project', project.id] })
      setShowAddFeature(false)
      resetFeature()
      toast.success('New feature added to pipeline!')
    },
  })

  const updateFeatureMutation = useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/admin/features/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-client-projects'] })
      qc.invalidateQueries({ queryKey: ['admin-client-project', project.id] })
      toast.success('Feature status updated!')
    },
  })

  const deleteFeatureMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/features/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-client-projects'] })
      qc.invalidateQueries({ queryKey: ['admin-client-project', project.id] })
      toast.info('Feature removed from pipeline.')
    },
  })

  const tasks = currentProject.tasks || []
  const dailyLogs = currentProject.dailyLogs || []
  const issues = currentProject.issues || []
  const features = currentProject.features || []
  const openIssuesCount = issues.filter((i) => i.status !== 'RESOLVED').length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-5xl w-full p-5 sm:p-7 shadow-2xl flex flex-col max-h-[92vh] border border-gray-200">
        {/* Drawer Header */}
        <div className="flex items-start justify-between border-b border-gray-100 pb-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-brand-blue/10 text-brand-blue rounded-2xl shrink-0 mt-0.5">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-extrabold font-heading text-gray-900">
                  {currentProject.projectTitle}
                </h2>
                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-lg border ${STATUS_COLORS[currentProject.status]}`}>
                  {STATUS_LABELS[currentProject.status]}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${HEALTH_COLORS[currentProject.health || 'ON_TRACK']}`}>
                  ● {currentProject.health === 'DELAYED' ? 'Delayed' : currentProject.health === 'AT_RISK' ? 'At Risk' : 'On Track'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5 flex-wrap">
                <span>Client:</span>
                <strong className="text-gray-800">{currentProject.clientName}</strong>
                <span className="text-gray-300">&bull;</span>
                <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                  {currentProject.projectType || 'Website Development'}
                </span>
                {currentProject.client && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.2 rounded">
                    Client Portal Linked
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onEditFull(currentProject)
                onClose()
              }}
              className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-brand-blue text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit Full Form
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Navigation Tabs ────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-b border-gray-100 py-3 scrollbar-none">
          {[
            { id: 'overview', label: 'Overview & Links', icon: FileText },
            { id: 'dailyLogs', label: `Daily Logs (${dailyLogs.length})`, icon: Clock, badge: dailyLogs.length },
            { id: 'tasks', label: `Tasks (${tasks.filter(t => t.status === 'DONE').length}/${tasks.length})`, icon: Layers },
            { id: 'issues', label: `Bugs & Issues`, icon: Bug, count: openIssuesCount, countDanger: true },
            { id: 'features', label: `Features (${features.length})`, icon: Sparkles },
            { id: 'vault', label: `Project Vault (${currentProject.attachments?.length || 0})`, icon: Paperclip },
            { id: 'billing', label: 'Milestone Invoices', icon: Landmark },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-brand-blue text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700 font-extrabold'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* ── Tab Content Area ───────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto mt-4 pr-1">
          {/* TAB 1: OVERVIEW & LINKS */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Top Metrics Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Progress</p>
                  <p className="text-xl font-black text-brand-blue mt-1 font-mono">{currentProject.progress}%</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Financial Budget</p>
                  <p className="text-xl font-black text-gray-900 mt-1">{currentProject.budget || '₹ Custom'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Start Date</p>
                  <p className="text-xs font-bold text-gray-800 mt-2 font-mono">
                    {new Date(currentProject.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Target Deadline</p>
                  <p className="text-xs font-bold text-gray-800 mt-2 font-mono">
                    {new Date(currentProject.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Quick URLs (Live, Staging, Repo) */}
              <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-200 space-y-2">
                <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5 uppercase tracking-wider">
                  <Globe className="w-3.5 h-3.5 text-brand-blue" />
                  Deployment &amp; Repository URLs
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="p-3 bg-white rounded-xl border border-gray-200 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Live Production URL</p>
                      <p className="text-xs font-medium text-gray-800 truncate">
                        {currentProject.liveUrl || 'Not set'}
                      </p>
                    </div>
                    {currentProject.liveUrl && (
                      <a href={currentProject.liveUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 text-brand-blue hover:bg-blue-50 rounded-lg">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-gray-200 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Staging / Test URL</p>
                      <p className="text-xs font-medium text-gray-800 truncate">
                        {currentProject.stagingUrl || 'Not set'}
                      </p>
                    </div>
                    {currentProject.stagingUrl && (
                      <a href={currentProject.stagingUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 text-brand-blue hover:bg-blue-50 rounded-lg">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-gray-200 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Git Repository URL</p>
                      <p className="text-xs font-medium text-gray-800 truncate">
                        {currentProject.repoUrl || 'Not set'}
                      </p>
                    </div>
                    {currentProject.repoUrl && (
                      <a href={currentProject.repoUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 text-brand-blue hover:bg-blue-50 rounded-lg">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Description & Credentials Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-200 space-y-1">
                  <p className="text-xs font-bold text-gray-700">Project Scope &amp; Brief:</p>
                  <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {currentProject.description || 'No description provided.'}
                  </p>
                </div>
                <div className="bg-amber-50/40 p-4 rounded-2xl border border-amber-200/80 space-y-1">
                  <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-700" />
                    Internal Access Credentials &amp; Admin Notes:
                  </p>
                  <p className="text-xs text-amber-950/80 leading-relaxed whitespace-pre-wrap font-mono text-[11px]">
                    {currentProject.credentialsNotes || currentProject.notes || 'No confidential credentials or notes saved.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DAILY WORK LOGS */}
          {activeTab === 'dailyLogs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Chronological Work Logs ({dailyLogs.length})
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Record daily progress, new features, resolved bugs, and next day plans.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddLog(!showAddLog)}
                  className="px-3.5 py-1.5 bg-brand-blue hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {showAddLog ? 'Cancel' : 'Log Today’s Work'}
                </button>
              </div>

              {/* Quick Add Daily Log Form */}
              {showAddLog && (
                <form
                  onSubmit={handleLogSubmit((data) => createLogMutation.mutate(data))}
                  className="bg-gray-50/80 p-5 rounded-2xl border border-gray-200 space-y-3.5 animate-fadeIn"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">Date *</label>
                      <input
                        type="date"
                        {...regLog('date', { required: true })}
                        className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">
                        Time Spent (Hours)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        {...regLog('timeSpentHours')}
                        placeholder="e.g. 5.5"
                        className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      Work Completed Today *
                    </label>
                    <textarea
                      rows={2}
                      {...regLog('workDone', { required: true })}
                      placeholder="Summary of modules built, layouts completed, or tasks delivered..."
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-brand-blue block mb-1">
                        ✨ Features Developed
                      </label>
                      <input
                        {...regLog('featuresAdded')}
                        placeholder="e.g. Category filter, Cart drawer"
                        className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-emerald-700 block mb-1">
                        🐛 Bugs Fixed
                      </label>
                      <input
                        {...regLog('bugsFixed')}
                        placeholder="e.g. Mobile header padding, Auth token expiration"
                        className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-rose-700 block mb-1">
                        ⚠️ Issues / Blockers Encountered
                      </label>
                      <input
                        {...regLog('issuesEncountered')}
                        placeholder="e.g. Awaiting client payment credentials"
                        className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-amber-800 block mb-1">
                        🎯 Next Day's Plan
                      </label>
                      <input
                        {...regLog('nextDayPlan')}
                        placeholder="e.g. Setup Razorpay webhook, deploy to staging"
                        className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowAddLog(false)}
                      className="px-3.5 py-1.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={logSubmitting || createLogMutation.isPending}
                      className="px-4 py-1.5 bg-brand-blue text-white text-xs font-bold rounded-xl shadow-xs"
                    >
                      Save Daily Log
                    </button>
                  </div>
                </form>
              )}

              {/* Logs Timeline */}
              {dailyLogs.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                  <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-600">No daily logs recorded yet.</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Click "Log Today’s Work" to maintain daily progress accountability.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dailyLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 rounded-2xl border border-gray-200/90 bg-white hover:border-gray-300 transition-all space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-gray-900 font-mono bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                            {new Date(log.date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="text-xs text-gray-600 font-medium flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-gray-400" />
                            {log.authorName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {log.timeSpentHours > 0 && (
                            <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                              {log.timeSpentHours} hrs
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteLog({ isOpen: true, id: log.id })}
                            className="p-1 text-gray-300 hover:text-rose-600 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-gray-800 leading-relaxed font-medium">{log.workDone}</p>

                      {(log.featuresAdded || log.bugsFixed) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                          {log.featuresAdded && (
                            <div className="bg-blue-50/50 p-2 rounded-xl border border-blue-100">
                              <span className="font-bold text-brand-blue block text-[10px]">✨ Features Added:</span>
                              <span className="text-gray-700">{log.featuresAdded}</span>
                            </div>
                          )}
                          {log.bugsFixed && (
                            <div className="bg-emerald-50/50 p-2 rounded-xl border border-emerald-100">
                              <span className="font-bold text-emerald-700 block text-[10px]">🐛 Bugs Fixed:</span>
                              <span className="text-gray-700">{log.bugsFixed}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {(log.issuesEncountered || log.nextDayPlan) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                          {log.issuesEncountered && (
                            <div className="bg-rose-50/50 p-2 rounded-xl border border-rose-100">
                              <span className="font-bold text-rose-700 block text-[10px]">⚠️ Issues / Blockers:</span>
                              <span className="text-gray-700">{log.issuesEncountered}</span>
                            </div>
                          )}
                          {log.nextDayPlan && (
                            <div className="bg-amber-50/50 p-2 rounded-xl border border-amber-100">
                              <span className="font-bold text-amber-800 block text-[10px]">🎯 Next Day Plan:</span>
                              <span className="text-gray-700">{log.nextDayPlan}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TASKS & DELIVERABLES */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 flex-wrap gap-2">
                <div>
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Project Work Tasks ({tasks.length})
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Track deliverables, checklist items, and auto-sync completion progress.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={autoCalculateProgress}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-emerald-200"
                    title="Calculate completion % based on finished tasks"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    Auto-Sync Progress %
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddTask(!showAddTask)}
                    className="px-3.5 py-1.5 bg-brand-blue hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {showAddTask ? 'Cancel' : 'Add Task'}
                  </button>
                </div>
              </div>

              {/* Quick Add Task Form */}
              {showAddTask && (
                <form
                  onSubmit={handleTaskSubmit((data) => createTaskMutation.mutate(data))}
                  className="bg-gray-50/80 p-4 rounded-2xl border border-gray-200 space-y-3 animate-fadeIn"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">Task Title *</label>
                      <input
                        {...regTask('title', { required: true })}
                        placeholder="e.g. Integrate Payment Gateway API"
                        className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">Priority</label>
                      <select
                        {...regTask('priority')}
                        className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">Due Date</label>
                      <input
                        type="date"
                        {...regTask('dueDate')}
                        className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowAddTask(false)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={taskSubmitting || createTaskMutation.isPending}
                      className="px-4 py-1.5 bg-brand-blue text-white text-xs font-bold rounded-xl shadow-xs"
                    >
                      Create Task
                    </button>
                  </div>
                </form>
              )}

              {/* Tasks List */}
              {tasks.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                  <Layers className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-600">No work tasks added to this project yet.</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Add deliverables above to track progress accurately.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 bg-white rounded-xl border border-gray-200 flex items-center justify-between gap-3 hover:border-gray-300 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => {
                            const nextStatus = task.status === 'DONE' ? 'TODO' : 'DONE'
                            updateTaskStatusMutation.mutate({ id: task.id, status: nextStatus })
                          }}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                            task.status === 'DONE'
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-gray-300 hover:border-brand-blue'
                          }`}
                        >
                          {task.status === 'DONE' && <Check className="w-3.5 h-3.5" />}
                        </button>
                        <div className="min-w-0">
                          <p className={`text-xs font-bold truncate ${
                            task.status === 'DONE' ? 'line-through text-gray-400' : 'text-gray-900'
                          }`}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400 font-mono">
                            {task.dueDate && (
                              <span>Due: {new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                            )}
                            {task.assignedTo && <span>Assignee: {task.assignedTo}</span>}
                          </div>
                        </div>
                      </div>

                      <select
                        value={task.status}
                        onChange={(e) => updateTaskStatusMutation.mutate({ id: task.id, status: e.target.value })}
                        className="text-[10px] font-bold px-2 py-1 rounded-lg border bg-gray-50 text-gray-700 cursor-pointer focus:outline-none"
                      >
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="DONE">Completed</option>
                        <option value="BLOCKED">Blocked</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: BUGS & ISSUES TRACKER */}
          {activeTab === 'issues' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Project Bugs &amp; Blockers ({issues.length})
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Track technical issues, requirement gaps, and blockers until resolution.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddIssue(!showAddIssue)}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {showAddIssue ? 'Cancel' : 'Report Bug / Issue'}
                </button>
              </div>

              {/* Add Issue Form */}
              {showAddIssue && (
                <form
                  onSubmit={handleIssueSubmit((data) => createIssueMutation.mutate(data))}
                  className="bg-rose-50/30 p-4 rounded-2xl border border-rose-200/80 space-y-3 animate-fadeIn"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">Issue Title *</label>
                      <input
                        {...regIssue('title', { required: true })}
                        placeholder="e.g. Payment Gateway Webhook signature mismatch"
                        className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">Severity</label>
                      <select
                        {...regIssue('severity')}
                        className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white font-bold"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical Blocker</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">Issue Type</label>
                      <select
                        {...regIssue('issueType')}
                        className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white"
                      >
                        <option value="BUG">Bug / Defect</option>
                        <option value="TECHNICAL">Technical Architecture</option>
                        <option value="REQUIREMENT_GAP">Requirement Gap / Client Dependency</option>
                        <option value="OTHER">Other Issue</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">Assigned Developer</label>
                      <input
                        {...regIssue('assignedTo')}
                        placeholder="Developer Name"
                        className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Description / Error Details</label>
                    <textarea
                      rows={2}
                      {...regIssue('description')}
                      placeholder="Steps to reproduce, error logs, or missing requirements..."
                      className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-rose-200">
                    <button
                      type="button"
                      onClick={() => setShowAddIssue(false)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={issueSubmitting || createIssueMutation.isPending}
                      className="px-4 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-xl shadow-xs"
                    >
                      Save Issue
                    </button>
                  </div>
                </form>
              )}

              {/* Issues List */}
              {issues.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-700">Zero active bugs or blockers.</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Everything is running smoothly.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {issues.map((issue) => (
                    <div
                      key={issue.id}
                      className={`p-3.5 rounded-2xl border transition-all space-y-2 ${
                        issue.status === 'RESOLVED'
                          ? 'bg-gray-50/60 border-gray-200 opacity-70'
                          : issue.severity === 'CRITICAL'
                          ? 'bg-rose-50/40 border-rose-200'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                              issue.severity === 'CRITICAL'
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : issue.severity === 'HIGH'
                                ? 'bg-orange-50 text-orange-700 border-orange-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {issue.severity}
                          </span>
                          <span className="text-xs font-bold text-gray-900">{issue.title}</span>
                          <span className="text-[10px] text-gray-400">({issue.issueType})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={issue.status}
                            onChange={(e) => updateIssueMutation.mutate({ id: issue.id, status: e.target.value })}
                            className="text-[10px] font-bold px-2 py-1 rounded-lg border bg-white cursor-pointer focus:outline-none"
                          >
                            <option value="OPEN">Open</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="BLOCKED">Blocked</option>
                            <option value="RESOLVED">Resolved ✅</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteIssue({ isOpen: true, id: issue.id, title: issue.title })}
                            className="p-1 text-gray-300 hover:text-rose-600 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {issue.description && (
                        <p className="text-xs text-gray-600 leading-relaxed font-sans">{issue.description}</p>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 font-mono">
                        <span>Assigned: {issue.assignedTo || 'Unassigned'}</span>
                        {issue.resolvedAt && (
                          <span className="text-emerald-700 font-bold">
                            Resolved on: {new Date(issue.resolvedAt).toLocaleDateString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: FEATURES PIPELINE */}
          {activeTab === 'features' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Features Pipeline ({features.length})
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Track custom feature requests, development states, and customer releases.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddFeature(!showAddFeature)}
                  className="px-3.5 py-1.5 bg-brand-blue hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {showAddFeature ? 'Cancel' : 'Add Feature'}
                </button>
              </div>

              {/* Add Feature Form */}
              {showAddFeature && (
                <form
                  onSubmit={handleFeatureSubmit((data) => createFeatureMutation.mutate(data))}
                  className="bg-blue-50/40 p-4 rounded-2xl border border-blue-200 space-y-3 animate-fadeIn"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">Feature Name *</label>
                      <input
                        {...regFeature('name', { required: true })}
                        placeholder="e.g. Multi-Currency Selector"
                        className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">Status</label>
                      <select
                        {...regFeature('status')}
                        className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white font-bold"
                      >
                        <option value="PLANNED">Planned</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="RELEASED">Released</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">Requested By</label>
                      <input
                        {...regFeature('requestedBy')}
                        placeholder="e.g. Client CEO"
                        className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">Assigned Lead</label>
                      <input
                        {...regFeature('assignedTo')}
                        placeholder="Developer Name"
                        className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Description &amp; Deliverables</label>
                    <textarea
                      rows={2}
                      {...regFeature('description')}
                      placeholder="Specifications, scope, and user flow..."
                      className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-blue-200">
                    <button
                      type="button"
                      onClick={() => setShowAddFeature(false)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={featureSubmitting || createFeatureMutation.isPending}
                      className="px-4 py-1.5 bg-brand-blue text-white text-xs font-bold rounded-xl shadow-xs"
                    >
                      Save Feature
                    </button>
                  </div>
                </form>
              )}

              {/* Features List */}
              {features.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                  <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-600">No new features added yet.</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Track feature requests and release states here.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {features.map((feature) => (
                    <div
                      key={feature.id}
                      className="p-3.5 rounded-2xl border border-gray-200 bg-white flex items-center justify-between gap-3 hover:border-gray-300 transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-bold text-gray-900">{feature.name}</p>
                          <span
                            className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                              feature.status === 'RELEASED'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : feature.status === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : feature.status === 'IN_PROGRESS'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-gray-100 text-gray-700 border-gray-200'
                            }`}
                          >
                            {feature.status}
                          </span>
                        </div>
                        {feature.description && (
                          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{feature.description}</p>
                        )}
                        <p className="text-[10px] text-gray-400 mt-1 font-mono">
                          Requested by: {feature.requestedBy || 'Client'} &bull; Assignee: {feature.assignedTo || 'Unassigned'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={feature.status}
                          onChange={(e) => updateFeatureMutation.mutate({ id: feature.id, status: e.target.value })}
                          className="text-[10px] font-bold px-2 py-1 rounded-lg border bg-gray-50 text-gray-700 cursor-pointer focus:outline-none"
                        >
                          <option value="PLANNED">Planned</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="RELEASED">Released 🚀</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteFeature({ isOpen: true, id: feature.id, name: feature.name })}
                          className="p-1 text-gray-300 hover:text-rose-600 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: PROJECT VAULT */}
          {activeTab === 'vault' && (
            <div className="p-1">
              <AttachmentSection
                attachments={currentProject.attachments || []}
                clientProjectId={currentProject.id}
                onUploadSuccess={() => {
                  refetchProject()
                  qc.invalidateQueries({ queryKey: ['admin-client-projects'] })
                }}
              />
            </div>
          )}

          {/* TAB 7: MILESTONE BILLING */}
          {activeTab === 'billing' && (
            <div className="p-1">
              <AdminBillingSection
                projectId={currentProject.id}
                clientProjectId={currentProject.id}
                currentRole="ADMIN"
              />
            </div>
          )}
        </div>
      </div>

      {/* Confirm Modals */}
      <ConfirmModal
        isOpen={confirmDeleteLog.isOpen}
        onClose={() => setConfirmDeleteLog({ isOpen: false, id: null })}
        onConfirm={() => {
          if (confirmDeleteLog.id) {
            deleteLogMutation.mutate(confirmDeleteLog.id)
            setConfirmDeleteLog({ isOpen: false, id: null })
          }
        }}
        title="Delete Daily Work Log"
        message="Are you sure you want to permanently delete this daily work log entry?"
        confirmText="Delete Log"
        variant="danger"
      />

      <ConfirmModal
        isOpen={confirmDeleteIssue.isOpen}
        onClose={() => setConfirmDeleteIssue({ isOpen: false, id: null, title: '' })}
        onConfirm={() => {
          if (confirmDeleteIssue.id) {
            deleteIssueMutation.mutate(confirmDeleteIssue.id)
            setConfirmDeleteIssue({ isOpen: false, id: null, title: '' })
          }
        }}
        title="Delete Bug / Issue"
        message="Are you sure you want to delete this issue record?"
        itemTitle={confirmDeleteIssue.title}
        confirmText="Delete Issue"
        variant="danger"
      />

      <ConfirmModal
        isOpen={confirmDeleteFeature.isOpen}
        onClose={() => setConfirmDeleteFeature({ isOpen: false, id: null, name: '' })}
        onConfirm={() => {
          if (confirmDeleteFeature.id) {
            deleteFeatureMutation.mutate(confirmDeleteFeature.id)
            setConfirmDeleteFeature({ isOpen: false, id: null, name: '' })
          }
        }}
        title="Delete Feature from Pipeline"
        message="Are you sure you want to delete this feature from the development pipeline?"
        itemTitle={confirmDeleteFeature.name}
        confirmText="Delete Feature"
        variant="danger"
      />
    </div>
  )
}
