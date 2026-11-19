/**
 * AdminClientProjectsPage.jsx — Company Development Projects Tracker & Executive Reporting
 * 
 * Internal & Client Software Projects • Stage Lifecycles • Team Allocation • Commercials & Boss/Management Reports
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
  Users,
  Clock,
  FolderOpen,
  Eye,
  FileCheck,
  RefreshCw,
  Building2,
  FileSpreadsheet,
  Globe,
  ExternalLink,
  Code2,
  Layers,
  Printer,
  DollarSign,
  AlertTriangle,
  Sparkles,
  Calendar,
  CreditCard,
  Link2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Paperclip,
  Activity,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { api } from '@/utils/api'
import { SEO, ConfirmModal } from '@/components/ui'
import AttachmentSection from '@/components/ui/AttachmentSection'
import { useToast } from '@/components/ui/ToastProvider'

// ── Development Stages ──────────────────────────────────────────
const DEV_STAGES = [
  { id: 'PLANNING', label: '1. Requirements & Planning', icon: '📋', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  { id: 'UI_UX_DESIGN', label: '2. UI/UX Design & Wireframes', icon: '🎨', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'FRONTEND_DEV', label: '3. Frontend Development', icon: '💻', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'BACKEND_DEV', label: '4. Backend & Database Engineering', icon: '⚙️', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'TESTING_QA', label: '5. Testing & Bug Fixing (QA)', icon: '🧪', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'CLIENT_REVIEW', label: '6. Client Demo & Feedback', icon: '🔍', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { id: 'DEPLOYMENT', label: '7. Live Production Launch', icon: '🚀', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold' },
  { id: 'COMPLETED', label: '8. Completed & Maintenance', icon: '✅', color: 'bg-teal-50 text-teal-700 border-teal-200 font-bold' },
]

const STAGE_MAP = DEV_STAGES.reduce((acc, s) => {
  acc[s.id] = s
  return acc
}, {})

// ── Project Types (Suggestions & Formatter) ─────────────────────
const PROJECT_TYPES = [
  { id: 'FULL_STACK', label: 'Full-Stack Web Application' },
  { id: 'MOBILE_APP', label: 'Android & iOS Mobile App' },
  { id: 'WEBSITE', label: 'Corporate Website' },
  { id: 'ECOMMERCE', label: 'E-Commerce Platform' },
  { id: 'ADMIN_PORTAL', label: 'Admin Panel / Internal CRM' },
  { id: 'API_BACKEND', label: 'REST API & Cloud Services' },
  { id: 'CUSTOM', label: 'Custom Software Solution' },
]

const COMMON_PROJECT_TYPES = [
  'Full-Stack Web Application',
  'Android & iOS Mobile App',
  'E-Commerce Platform',
  'Corporate Website',
  'Admin Panel / Internal CRM',
  'School / College ERP',
  'Hospital & Clinic Software',
  'Billing & Invoicing System',
  'REST API & Cloud Services',
  'Landing Page & Funnel',
  'Custom Software Solution',
]

const formatProjectType = (val) => {
  if (!val) return 'Custom Software'
  const match = PROJECT_TYPES.find((t) => t.id === val || t.label.toLowerCase() === val.toLowerCase())
  if (match) return match.label
  return val
}

// ── Lifecycle & Health Constants ────────────────────────────────
const STATUSES = ['PLANNING', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'ON_HOLD']
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

const STATUS_LABELS = {
  PLANNING: 'Planning',
  IN_PROGRESS: 'In Progress',
  REVIEW: 'In Review / QA',
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

const PAYMENT_STATUS_OPTIONS = [
  { id: 'PENDING', label: '⏳ Payment Pending' },
  { id: 'ADVANCE_PAID', label: '💰 Advance Received' },
  { id: 'PARTIAL', label: '⚡ Partially Paid' },
  { id: 'FULLY_PAID', label: '✅ Fully Paid' },
]

const COMMON_PAYMENT_STATUSES = [
  '💰 Advance Received',
  '⏳ Payment Pending',
  '⚡ Partially Paid (50%)',
  '✅ Fully Paid',
  '📑 Milestone Based',
  '🔄 Monthly Retainer',
]

const formatPaymentStatus = (val) => {
  if (!val) return 'Pending'
  const match = PAYMENT_STATUS_OPTIONS.find((p) => p.id === val)
  if (match) return match.label
  return val
}

const inputCls =
  'w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all font-sans'

// ── Project Add / Edit Form ─────────────────────────────────────
function ProjectForm({ initial, onSave, onCancel, loading, onAttachmentChange }) {
  const toast = useToast()

  // Fetch assignable company team members for quick pills
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['admin-team-members-for-pills'],
    queryFn: () => api.get('/admin/team').then((r) => r.data || []),
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
          tags: Array.isArray(initial.tags) ? initial.tags.join(', ') : initial.tags || '',
          projectType: formatProjectType(initial.projectType) || 'Full-Stack Web Application',
          devStage: initial.devStage || 'PLANNING',
          health: initial.health || 'ON_TRACK',
          status: initial.status || 'PLANNING',
          priority: initial.priority || 'MEDIUM',
          progress: initial.progress ?? 0,
          clientContact: initial.clientContact || '',
          assignedTo: initial.assignedTo || '',
          budget: initial.budget || '',
          paymentStatus: formatPaymentStatus(initial.paymentStatus) || 'Advance Received',
          paymentReceived: initial.paymentReceived || '',
          paymentPending: initial.paymentPending || '',
          paymentNotes: initial.paymentNotes || '',
          initialRequirement: initial.initialRequirement || '',
          scopeFeatures: initial.scopeFeatures || initial.description || '',
          changeRequests: initial.changeRequests || '',
          extraTimeRequired: initial.extraTimeRequired || '',
          timeRemainingEstimate: initial.timeRemainingEstimate || '',
          currentStatusNote: initial.currentStatusNote || initial.notes || '',
          liveUrl: initial.liveUrl || '',
          stagingUrl: initial.stagingUrl || '',
          repoUrl: initial.repoUrl || '',
        }
      : {
          projectTitle: '',
          clientName: '',
          clientContact: '',
          projectType: 'Full-Stack Web Application',
          devStage: 'PLANNING',
          health: 'ON_TRACK',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          progress: 10,
          startDate: formatDateForInput(new Date()),
          deadline: '',
          assignedTo: '',
          budget: '',
          paymentStatus: 'Advance Received',
          paymentReceived: '',
          paymentPending: '',
          paymentNotes: '',
          initialRequirement: '',
          scopeFeatures: '',
          changeRequests: '',
          extraTimeRequired: '',
          timeRemainingEstimate: '',
          currentStatusNote: '',
          tags: 'React, Node.js, PostgreSQL',
          liveUrl: '',
          stagingUrl: '',
          repoUrl: '',
        },
  })

  const watchedProgress = watch('progress') || 0
  const watchedDevStage = watch('devStage') || 'PLANNING'
  const watchedPriority = watch('priority') || 'MEDIUM'
  const watchedHealth = watch('health') || 'ON_TRACK'

  const appendTeamMember = (memberName) => {
    const current = getValues('assignedTo') || ''
    if (!current) {
      setValue('assignedTo', memberName)
    } else if (!current.includes(memberName)) {
      setValue('assignedTo', `${current}, ${memberName}`)
    }
  }

  const appendTag = (techName) => {
    const current = getValues('tags') || ''
    if (!current) {
      setValue('tags', techName)
    } else if (!current.toLowerCase().includes(techName.toLowerCase())) {
      setValue('tags', `${current}, ${techName}`)
    }
  }

  const onSubmit = (data) => {
    const payload = {
      projectTitle: data.projectTitle,
      clientName: data.clientName,
      clientContact: data.clientContact || '',
      projectType: (data.projectType || 'Full-Stack Web Application').trim(),
      devStage: data.devStage || 'PLANNING',
      health: data.health || 'ON_TRACK',
      status: data.status || 'IN_PROGRESS',
      priority: data.priority || 'MEDIUM',
      progress: parseInt(data.progress || 0, 10),
      startDate: data.startDate,
      deadline: data.deadline,
      assignedTo: data.assignedTo || '',
      budget: data.budget || '',
      paymentStatus: (data.paymentStatus || 'Pending').trim(),
      paymentReceived: data.paymentReceived || '',
      paymentPending: data.paymentPending || '',
      paymentNotes: data.paymentNotes || '',
      initialRequirement: data.initialRequirement || '',
      scopeFeatures: data.scopeFeatures || '',
      description: data.scopeFeatures || '',
      changeRequests: data.changeRequests || '',
      extraTimeRequired: data.extraTimeRequired || '',
      timeRemainingEstimate: data.timeRemainingEstimate || '',
      currentStatusNote: data.currentStatusNote || '',
      notes: data.currentStatusNote || '',
      liveUrl: data.liveUrl || '',
      stagingUrl: data.stagingUrl || '',
      repoUrl: data.repoUrl || '',
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
      {/* ── CARD 1: Core Project & Client Identity ──────────────── */}
      <div className="bg-gray-50/70 p-5 sm:p-6 rounded-2xl border border-gray-200 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-brand-blue uppercase tracking-wider flex items-center gap-2">
            <span>📌</span> 1. Project &amp; Client Identity
          </p>
          <span className="text-[10px] text-gray-400 font-mono">* Required fields</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-gray-700 block mb-1.5">
              Project Title *
            </label>
            <input
              {...register('projectTitle', { required: true })}
              className={inputCls}
              placeholder="e.g. Freshinbasket — Grocery Mobile App & Admin Portal"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5 flex items-center justify-between">
              <span>Project Type</span>
              <span className="text-[10px] text-brand-blue font-semibold">Type custom or select</span>
            </label>
            <input
              list="project-type-suggestions"
              {...register('projectType')}
              className={inputCls}
              placeholder="e.g. Grocery App, School ERP, E-Commerce..."
            />
            <datalist id="project-type-suggestions">
              {COMMON_PROJECT_TYPES.map((pt) => (
                <option key={pt} value={pt} />
              ))}
            </datalist>
            {/* Quick Presets */}
            <div className="flex items-center gap-1 flex-wrap pt-1.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Presets:
              </span>
              {['Web App', 'Mobile App', 'E-Commerce', 'CRM / ERP', 'Website', 'Custom'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setValue('projectType', preset)}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-white hover:bg-brand-blue/10 text-gray-600 hover:text-brand-blue border border-gray-200 transition-all cursor-pointer shadow-2xs"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">
              Client / Company Name *
            </label>
            <input
              {...register('clientName', { required: true })}
              className={inputCls}
              placeholder="e.g. Freshinbasket Pvt Ltd (or Internal / Hindustan)"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">
              Client Contact / Phone / Email
            </label>
            <input
              {...register('clientContact')}
              className={inputCls}
              placeholder="e.g. +91 98765 43210 / client@email.com"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">
              Priority
            </label>
            <div className="grid grid-cols-4 gap-1">
              {PRIORITIES.map((p) => {
                const isSelected = watchedPriority === p
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setValue('priority', p)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? `${PRIORITY_COLORS[p]} ring-2 ring-brand-blue/30 shadow-xs font-extrabold`
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {p}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── CARD 2: Team Members & Developers ("Kaun Kaun Kaam Kar Raha Hai") ── */}
      <div className="bg-gray-50/70 p-5 sm:p-6 rounded-2xl border border-gray-200 space-y-4">
        <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-2">
          <span>👥</span> 2. Assigned Team Members &amp; Developers ("Kaun Kaun Kaam Kar Raha Hai")
        </p>

        <div>
          <label className="text-xs font-bold text-gray-700 block mb-1.5">
            Team Members Working on This Project
          </label>
          <input
            {...register('assignedTo')}
            className={inputCls}
            placeholder="Type names and roles: e.g. Aman (Full Stack Lead), Priya (UI/UX), Rohit (Backend), Mohit (QA)"
          />
          <p className="text-[11px] text-gray-500 mt-1">
            Tip: Type developer names directly or click company team pills below to insert them:
          </p>
        </div>

        {teamMembers && teamMembers.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Quick Add Staff:
            </span>
            {teamMembers.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => appendTeamMember(`${m.name || m.email.split('@')[0]} (${m.role || 'Developer'})`)}
                className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-white hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 border border-gray-200 transition-all cursor-pointer shadow-2xs"
              >
                + {m.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── CARD 3: Development Stage & Progress Timeline ─────────── */}
      <div className="bg-gray-50/70 p-5 sm:p-6 rounded-2xl border border-gray-200 space-y-4">
        <p className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-2">
          <span>⚡</span> 3. Development Process Stage &amp; Timeline
        </p>

        {/* Visual Stage Selector */}
        <div>
          <label className="text-xs font-bold text-gray-700 block mb-2">
            Current Development Stage:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {DEV_STAGES.map((s) => {
              const isSelected = watchedDevStage === s.id
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setValue('devStage', s.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? 'bg-brand-blue text-white border-brand-blue shadow-sm font-bold'
                      : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-200 text-xs'
                  }`}
                >
                  <span className="text-base shrink-0">{s.icon}</span>
                  <span className="text-[11px] leading-tight font-medium">{s.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 pt-2">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">
              Lifecycle Status
            </label>
            <select {...register('status')} className={inputCls}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">
              Project Health
            </label>
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: 'ON_TRACK', label: '🟢 On Track', color: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
                { id: 'AT_RISK', label: '🟡 At Risk', color: 'bg-amber-50 text-amber-800 border-amber-300' },
                { id: 'DELAYED', label: '🔴 Delayed', color: 'bg-rose-50 text-rose-800 border-rose-300' },
              ].map((h) => {
                const isSelected = watchedHealth === h.id
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setValue('health', h.id)}
                    className={`py-2 px-1 text-center rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? `${h.color} ring-2 ring-brand-blue/30 shadow-xs font-extrabold`
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {h.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">
              Start Date *
            </label>
            <input
              type="date"
              {...register('startDate', { required: true })}
              className={inputCls}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">
              Target Deadline *
            </label>
            <input
              type="date"
              {...register('deadline', { required: true })}
              className={inputCls}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5 flex items-center justify-between">
              <span>Time Remaining</span>
              <span className="text-[10px] text-brand-blue font-semibold">Aur kitna lagega</span>
            </label>
            <input
              list="time-remaining-suggestions"
              {...register('timeRemainingEstimate')}
              className={inputCls}
              placeholder="e.g. 10 Working Days, 2 Weeks..."
            />
            <datalist id="time-remaining-suggestions">
              <option value="3-4 Days (Final QA)" />
              <option value="1 Week" />
              <option value="10 Working Days" />
              <option value="2 Weeks" />
              <option value="1 Month" />
              <option value="Ready for Review" />
              <option value="Live & Maintenance" />
            </datalist>
            <div className="flex items-center gap-1 flex-wrap pt-1.5">
              {['3-4 Days', '1 Week', '10 Days', '2 Weeks'].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setValue('timeRemainingEstimate', chip)}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-white hover:bg-brand-blue/10 text-gray-600 hover:text-brand-blue border border-gray-200 transition-all cursor-pointer shadow-2xs"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Progress Slider */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-gray-800 flex-wrap gap-2">
            <span>🎯 Overall Completion Progress</span>
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
              <span className="px-2.5 py-0.5 rounded-full bg-brand-blue text-white font-mono font-bold text-xs ml-1">
                {watchedProgress}%
              </span>
            </div>
          </div>

          <div className="relative pt-1">
            <div className="overflow-hidden h-3 text-xs flex rounded-full bg-gray-100 border border-gray-200">
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

      {/* ── CARD 4: Scope Features & Changes ("Kya Kya Banana Hai" & "New Kya Add Hua") ── */}
      <div className="bg-gray-50/70 p-5 sm:p-6 rounded-2xl border border-gray-200 space-y-4">
        <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-2">
          <span>📝</span> 4. Scope, Initial Vision &amp; Client Changes ("Pehle Kya Tha", "Ab Kya Banana Hai" aur "New Kya Add Hua")
        </p>

        {/* Optional Context: Project Pehle Kya Tha */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-1.5">
          <label className="text-xs font-bold text-gray-800 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span>📜</span> Initial Requirement ("Project Pehle Kya Tha" — Optional Background)
            </span>
            <span className="text-[10px] text-gray-400 font-normal">Optional • Explains scope evolution to boss/management</span>
          </label>
          <textarea
            rows={2}
            {...register('initialRequirement')}
            className={`${inputCls} resize-none bg-gray-50/60 font-sans`}
            placeholder="e.g. Pehle client ne basic 4-5 page brochure website with contact form bola tha."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">
              What Needs to be Built ("Kya Kya Banana Hai" — Current Deliverables &amp; Scope)
            </label>
            <textarea
              rows={4}
              {...register('scopeFeatures')}
              className={`${inputCls} resize-none font-sans`}
              placeholder="- User authentication &amp; profile&#10;- Product catalog &amp; live cart&#10;- Admin analytics dashboard&#10;- Razorpay &amp; Cash on Delivery checkout&#10;- Automated email &amp; SMS receipts"
            />
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-amber-800 block mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                New Additions by Client ("New Kya Add Karwaya Jisse Time Laga")
              </label>
              <textarea
                rows={3}
                {...register('changeRequests')}
                className={`${inputCls} resize-none bg-amber-50/40 border-amber-200/80 focus:bg-white font-sans`}
                placeholder="e.g. Client requested WhatsApp OTP login, multi-currency payouts and vendor commission on 10th Nov."
              />
            </div>

            {/* Extra Time Required Field */}
            <div>
              <label className="text-xs font-bold text-amber-900 block mb-1 flex items-center justify-between">
                <span>Extra Days / Time Added ("Isse Kitna Extra Time Laga/Lagega")</span>
                <span className="text-[10px] text-amber-700 font-semibold">Timeline delay impact</span>
              </label>
              <input
                list="extra-time-suggestions"
                {...register('extraTimeRequired')}
                className={`${inputCls} bg-amber-50/30 border-amber-200/80`}
                placeholder="e.g. +7 Days, +15 Days, +2 Weeks..."
              />
              <datalist id="extra-time-suggestions">
                <option value="+3 Days" />
                <option value="+5 Days" />
                <option value="+7 Days" />
                <option value="+10 Days" />
                <option value="+15 Days" />
                <option value="+2 Weeks" />
                <option value="+1 Month" />
                <option value="No Extra Delay" />
              </datalist>
              <div className="flex items-center gap-1 flex-wrap pt-1">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Quick Pick:</span>
                {['+3 Days', '+5 Days', '+7 Days', '+10 Days', '+15 Days', 'No Delay'].map((delayChip) => (
                  <button
                    key={delayChip}
                    type="button"
                    onClick={() => setValue('extraTimeRequired', delayChip)}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white hover:bg-amber-100 text-amber-800 border border-amber-200 transition-all cursor-pointer shadow-2xs"
                  >
                    {delayChip}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CARD 5: Commercials, Status Remarks & Links ─────────── */}
      <div className="bg-gray-50/70 p-5 sm:p-6 rounded-2xl border border-gray-200 space-y-4">
        <p className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-2">
          <span>💰</span> 5. Commercials, Payment Status &amp; Current Scene ("Kya Scene Hai")
        </p>

        {/* Commercials Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">
              Total Project Budget
            </label>
            <input
              {...register('budget')}
              className={inputCls}
              placeholder="e.g. ₹75,000"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5 flex items-center justify-between">
              <span>Payment Status</span>
              <span className="text-[10px] text-blue-600 font-semibold">Custom or pick</span>
            </label>
            <input
              list="payment-status-suggestions"
              {...register('paymentStatus')}
              className={inputCls}
              placeholder="e.g. Advance Received, Fully Paid, 50% Token..."
            />
            <datalist id="payment-status-suggestions">
              {COMMON_PAYMENT_STATUSES.map((ps) => (
                <option key={ps} value={ps} />
              ))}
            </datalist>
            {/* Quick Status Pills */}
            <div className="flex items-center gap-1 flex-wrap pt-1.5">
              {['Advance Recv', 'Pending', 'Partially Paid', 'Fully Paid', 'Milestone'].map((statusChip) => (
                <button
                  key={statusChip}
                  type="button"
                  onClick={() => setValue('paymentStatus', statusChip)}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-white hover:bg-blue-50 text-gray-600 hover:text-blue-700 border border-gray-200 transition-all cursor-pointer shadow-2xs"
                >
                  {statusChip}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">
              Amount Received
            </label>
            <input
              {...register('paymentReceived')}
              className={inputCls}
              placeholder="e.g. ₹35,000"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">
              Amount Pending
            </label>
            <input
              {...register('paymentPending')}
              className={inputCls}
              placeholder="e.g. ₹40,000"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-700 block mb-1.5">
            Payment Milestone / Terms Notes
          </label>
          <input
            {...register('paymentNotes')}
            className={inputCls}
            placeholder="e.g. 50% advance received, 50% on live launch sign-off"
          />
        </div>

        {/* Current Status Scene Notes */}
        <div>
          <label className="text-xs font-bold text-gray-800 block mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-blue" />
            Current Project Scene &amp; Latest Remarks ("Konse Project Ka Kya Scene Hai")
          </label>
          <textarea
            rows={3}
            {...register('currentStatusNote')}
            className={`${inputCls} resize-none bg-blue-50/20 border-blue-200/60 focus:bg-white`}
            placeholder="e.g. Frontend 90% completed. Backend APIs connected. Testing payment gateway today. Client staging demo this Friday."
          />
        </div>

        {/* Technical Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-blue-500" /> Live Website URL
            </label>
            <input {...register('liveUrl')} className={inputCls} placeholder="https://clientdomain.com" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5 flex items-center gap-1">
              <ExternalLink className="w-3.5 h-3.5 text-amber-500" /> Staging Demo URL
            </label>
            <input {...register('stagingUrl')} className={inputCls} placeholder="https://staging.clientdomain.com" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5 flex items-center gap-1">
              <Code2 className="w-3.5 h-3.5 text-purple-500" /> Git Repository URL
            </label>
            <input {...register('repoUrl')} className={inputCls} placeholder="https://github.com/org/repo" />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-700 block mb-1.5 flex items-center justify-between">
            <span>Tech Stack Tags (Comma Separated)</span>
            <span className="text-[10px] text-purple-600 font-semibold">Type custom or click pills</span>
          </label>
          <input
            {...register('tags')}
            className={inputCls}
            placeholder="React, Next.js, Node.js, PostgreSQL, Tailwind"
          />
          {/* Quick Tech Stack Pills */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Quick Tech:
            </span>
            {['React', 'Next.js', 'Node.js', 'Flutter', 'PostgreSQL', 'MongoDB', 'TailwindCSS', 'Python', 'AWS'].map((tech) => (
              <button
                key={tech}
                type="button"
                onClick={() => appendTag(tech)}
                className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-white hover:bg-purple-50 text-gray-600 hover:text-purple-700 border border-gray-200 transition-all cursor-pointer shadow-2xs"
              >
                + {tech}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CARD 6: File Vault Attachments (When Editing) ───────── */}
      {initial && (
        <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-200 space-y-4">
          <p className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
            <span>📎</span> 6. Project Vault Attachments &amp; Documents
          </p>
          <AttachmentSection
            attachments={initial.attachments}
            clientProjectId={initial.id}
            onUploadSuccess={onAttachmentChange}
          />
        </div>
      )}

      {/* Form Buttons */}
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
          className="flex items-center gap-2 bg-brand-blue hover:bg-blue-600 text-white px-7 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-brand-blue/20 hover:-translate-y-0.5 transition-all disabled:opacity-60 cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>{loading ? 'Saving Changes...' : initial ? 'Update Project' : 'Save & Track Project'}</span>
        </button>
      </div>
    </form>
  )
}

function escapePrintHtml(str) {
  if (str === null || str === undefined) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function printHtmlDocument(title, bodyHtml, isLandscape = false) {
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  iframe.style.visibility = 'hidden'
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow.document
  doc.open()
  doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapePrintHtml(title)}</title>
  <style>
    @page {
      size: A4 ${isLandscape ? 'landscape' : 'portrait'};
      margin: 12mm 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 12px;
      line-height: 1.5;
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #1B6EF3;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 900;
      color: #1B6EF3;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .brand-subtitle {
      font-size: 11px;
      color: #64748b;
      margin: 2px 0 0 0;
    }
    .badge-report {
      display: inline-block;
      padding: 4px 10px;
      background: #f1f5f9;
      color: #1e293b;
      font-weight: 800;
      font-size: 11px;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
    }
    .report-date {
      font-size: 10px;
      color: #94a3b8;
      margin-top: 4px;
      text-align: right;
    }
    .card {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px 14px;
      margin-bottom: 12px;
      background: #ffffff;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .card-title-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 8px;
    }
    .proj-title {
      font-size: 17px;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }
    .proj-client {
      font-size: 12px;
      color: #475569;
      margin-top: 2px;
    }
    .pill {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      color: #334155;
      white-space: nowrap;
    }
    .grid-5 {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 10px;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
      margin-top: 8px;
    }
    .grid-label {
      font-size: 9px;
      text-transform: uppercase;
      font-weight: 800;
      color: #94a3b8;
      display: block;
      margin-bottom: 2px;
    }
    .grid-val {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
    }
    .section-label {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .section-text {
      font-size: 11.5px;
      color: #334155;
      white-space: pre-wrap;
      line-height: 1.5;
      margin: 0;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .bg-blue {
      background: #f0f7ff;
      border-color: #bfdbfe;
    }
    .bg-amber {
      background: #fffbeb;
      border-color: #fde68a;
    }
    .bg-gray {
      background: #f8fafc;
      border-color: #e2e8f0;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
      margin-top: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #94a3b8;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      text-transform: uppercase;
      font-size: 9px;
      font-weight: 800;
      padding: 8px;
      text-align: left;
      border-bottom: 1px solid #cbd5e1;
    }
    td {
      padding: 8px;
      border-bottom: 1px solid #e2e8f0;
      color: #1e293b;
    }
    tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`)
  doc.close()

  iframe.contentWindow.focus()
  setTimeout(() => {
    iframe.contentWindow.print()
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe)
      }
    }, 2000)
  }, 350)
}

function generateSingleProjectHTML(project) {
  const stageObj = STAGE_MAP[project.devStage] || DEV_STAGES[0]
  const typeLabel = formatProjectType(project.projectType)
  const healthLabel = HEALTH_LABELS[project.health] || 'On Track'
  const statusLabel = STATUS_LABELS[project.status] || project.status
  const deadlineStr = project.deadline ? new Date(project.deadline).toLocaleDateString('en-IN') : 'N/A'
  const reportDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  let html = `
    <div class="header-bar">
      <div>
        <h1 class="brand-title">SnapTech Digital</h1>
        <p class="brand-subtitle">Software Engineering &bull; Digital Solutions Studio</p>
      </div>
      <div>
        <span class="badge-report">PROJECT STATUS BRIEF</span>
        <div class="report-date">Report Date: ${escapePrintHtml(reportDate)}</div>
      </div>
    </div>

    <!-- Title & Core Summary -->
    <div class="card bg-gray">
      <div class="card-title-bar">
        <div>
          <h2 class="proj-title">${escapePrintHtml(project.projectTitle)}</h2>
          <div class="proj-client">
            Client: <strong>${escapePrintHtml(project.clientName)}</strong>
            ${project.clientContact ? ` &bull; ${escapePrintHtml(project.clientContact)}` : ''}
          </div>
        </div>
        <div>
          <span class="pill">${escapePrintHtml(typeLabel)}</span>
        </div>
      </div>

      <div class="grid-5">
        <div>
          <span class="grid-label">Current Stage</span>
          <span class="grid-val" style="color: #1B6EF3;">${escapePrintHtml(stageObj.label)}</span>
        </div>
        <div>
          <span class="grid-label">Progress</span>
          <span class="grid-val" style="color: #059669;">${escapePrintHtml(project.progress)}% Complete</span>
        </div>
        <div>
          <span class="grid-label">Health &amp; Status</span>
          <span class="grid-val">${escapePrintHtml(healthLabel)} &bull; ${escapePrintHtml(statusLabel)}</span>
        </div>
        <div>
          <span class="grid-label">Deadline</span>
          <span class="grid-val">${escapePrintHtml(deadlineStr)}</span>
        </div>
        <div>
          <span class="grid-label">Time Remaining</span>
          <span class="grid-val" style="color: #1B6EF3;">${escapePrintHtml(project.timeRemainingEstimate || 'On Schedule')}</span>
        </div>
      </div>
    </div>

    <!-- Team Assigned -->
    <div class="card">
      <div class="section-label" style="color: #64748b;">👥 Assigned Developers &amp; Team</div>
      <div style="font-weight: 700; font-size: 13px; color: #0f172a;">
        ${escapePrintHtml(project.assignedTo || 'Unassigned / Core Team')}
      </div>
    </div>

    <!-- Current Scene & Status -->
    <div class="card bg-blue">
      <div class="section-label" style="color: #1B6EF3;">📍 Current Scene &amp; Latest Status</div>
      <p class="section-text" style="color: #1e3a8a;">
        ${escapePrintHtml(project.currentStatusNote || project.notes || 'Project is proceeding as per schedule.')}
      </p>
    </div>
  `

  if (project.initialRequirement) {
    html += `
      <div class="card bg-gray">
        <div class="section-label" style="color: #64748b;">📜 Project Background ("Project Pehle Kya Tha" — Initial Scope)</div>
        <p class="section-text">${escapePrintHtml(project.initialRequirement)}</p>
      </div>
    `
  }

  html += `
    <div class="grid-2">
      <div class="card" style="margin-bottom: 0;">
        <div class="section-label" style="color: #64748b;">📝 Agreed Deliverables ("Kya Kya Banana Hai")</div>
        <p class="section-text">${escapePrintHtml(project.scopeFeatures || project.description || 'Deliverables as per work agreement.')}</p>
      </div>

      <div class="card bg-amber" style="margin-bottom: 0;">
        <div class="section-label" style="color: #92400e;">⚠️ Client Additions ("New Kya Add Karwaya")</div>
        <p class="section-text" style="color: #78350f;">${escapePrintHtml(project.changeRequests || 'No additional change requests recorded.')}</p>
        ${project.extraTimeRequired ? `
          <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #fde68a; display: flex; justify-content: space-between; font-size: 11px;">
            <span style="font-weight: 700; color: #78350f;">Extra Time Added:</span>
            <span style="font-weight: 800; color: #be123c; background: #ffffff; padding: 2px 6px; border-radius: 4px; border: 1px solid #fecdd3;">⏱️ ${escapePrintHtml(project.extraTimeRequired)}</span>
          </div>
        ` : ''}
      </div>
    </div>

    <!-- Financials & Payment -->
    <div class="card bg-gray">
      <div class="section-label" style="color: #64748b; margin-bottom: 8px;">💰 Financials &amp; Payment Status</div>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
        <div>
          <span class="grid-label">Total Budget</span>
          <span style="font-size: 14px; font-weight: 800; color: #0f172a;">${escapePrintHtml(project.budget || '₹ Custom')}</span>
        </div>
        <div>
          <span class="grid-label">Received</span>
          <span style="font-size: 14px; font-weight: 800; color: #059669;">${escapePrintHtml(project.paymentReceived || '—')}</span>
        </div>
        <div>
          <span class="grid-label">Pending</span>
          <span style="font-size: 14px; font-weight: 800; color: #d97706;">${escapePrintHtml(project.paymentPending || '—')}</span>
        </div>
      </div>
      ${project.paymentNotes ? `
        <div style="font-size: 11px; color: #64748b; margin-top: 8px; padding-top: 6px; border-top: 1px solid #e2e8f0;">
          Notes: ${escapePrintHtml(project.paymentNotes)}
        </div>
      ` : ''}
    </div>
  `

  if (project.liveUrl || project.stagingUrl || project.repoUrl) {
    html += `
      <div class="card bg-gray" style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
        <span style="font-weight: 700; color: #64748b;">Links:</span>
        ${project.liveUrl ? `<span style="font-family: monospace; font-size: 11px; color: #1B6EF3;">Live: ${escapePrintHtml(project.liveUrl)}</span>` : ''}
        ${project.stagingUrl ? `<span style="font-family: monospace; font-size: 11px; color: #b45309;">Demo: ${escapePrintHtml(project.stagingUrl)}</span>` : ''}
        ${project.repoUrl ? `<span style="font-family: monospace; font-size: 11px; color: #7e22ce;">Repo: ${escapePrintHtml(project.repoUrl)}</span>` : ''}
      </div>
    `
  }

  html += `
    <div class="footer">
      <div>SnapTech Digital &bull; Confidential Management Documentation</div>
      <div>Printed by Project Lead / Management</div>
    </div>
  `

  return html
}

// ── Single Project Printable Sheet Modal ─────────────────────────
function PrintSingleProjectModal({ project, onClose }) {
  if (!project) return null

  const stageObj = STAGE_MAP[project.devStage] || DEV_STAGES[0]
  const typeLabel = formatProjectType(project.projectType)

  const handlePrint = () => {
    const html = generateSingleProjectHTML(project)
    printHtmlDocument(`SnapTech - ${project.projectTitle}`, html, false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[94vh] overflow-y-auto border border-gray-200">
        {/* Print Controls Header (Hidden during actual print) */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-brand-blue/10 text-brand-blue rounded-xl">
              <Printer className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-extrabold text-gray-900">Project Status Sheet</h3>
              <p className="text-xs text-gray-500">Executive summary for management &amp; client records</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-brand-blue hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Preview on Screen */}
        <div className="space-y-5 text-gray-900 font-sans">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-brand-blue pb-3.5">
            <div>
              <h1 className="text-2xl font-black text-brand-blue tracking-tight">SnapTech Digital</h1>
              <p className="text-xs text-gray-500 mt-0.5">Software Engineering &bull; Digital Solutions Studio</p>
            </div>
            <div className="text-right text-xs">
              <span className="px-2.5 py-1 bg-gray-100 font-bold rounded-lg border border-gray-200 text-gray-800">
                PROJECT STATUS BRIEF
              </span>
              <p className="text-[11px] text-gray-400 mt-1.5">
                Report Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Title & Core Grid */}
          <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-200">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-gray-900">{project.projectTitle}</h2>
                <p className="text-xs text-gray-600 font-medium mt-1">
                  Client: <strong className="text-gray-900">{project.clientName}</strong>
                  {project.clientContact && ` • ${project.clientContact}`}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-bold px-2 py-0.5 rounded border bg-white text-gray-800">
                  {typeLabel}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 pt-3 border-t border-gray-200/80 text-xs">
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-bold block">Current Stage</span>
                <span className="font-bold text-brand-blue">{stageObj.label}</span>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-bold block">Progress</span>
                <span className="font-extrabold text-emerald-600">{project.progress}% Complete</span>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-bold block">Health &amp; Status</span>
                <span className="font-bold">{HEALTH_LABELS[project.health] || 'On Track'} &bull; {STATUS_LABELS[project.status]}</span>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-bold block">Deadline</span>
                <span className="font-bold text-gray-900">
                  {project.deadline ? new Date(project.deadline).toLocaleDateString('en-IN') : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-bold block">Time Remaining</span>
                <span className="font-extrabold text-brand-blue">
                  {project.timeRemainingEstimate || 'On Schedule'}
                </span>
              </div>
            </div>
          </div>

          {/* Team Assigned */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-1 print-avoid-break">
            <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500">
              👥 Assigned Developers &amp; Team
            </h4>
            <p className="text-sm font-bold text-gray-900">
              {project.assignedTo || 'Unassigned / Core Team'}
            </p>
          </div>

          {/* Current Status Scene */}
          <div className="bg-blue-50/40 p-4 rounded-2xl border border-blue-200/80 space-y-1 print-avoid-break">
            <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-brand-blue">
              📍 Current Scene &amp; Latest Status
            </h4>
            <p className="text-xs text-gray-800 font-medium whitespace-pre-wrap leading-relaxed">
              {project.currentStatusNote || project.notes || 'Project is proceeding as per schedule.'}
            </p>
          </div>

          {/* Project Story / Evolution (If Initial Requirement Recorded) */}
          {project.initialRequirement && (
            <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-200 space-y-1 print-avoid-break">
              <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <span>📜</span> Project Background ("Project Pehle Kya Tha" — Initial Scope)
              </h4>
              <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                {project.initialRequirement}
              </p>
            </div>
          )}

          {/* Scope Features vs Changes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print-avoid-break">
            <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-1">
              <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500">
                📝 Agreed Deliverables ("Kya Kya Banana Hai")
              </h4>
              <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                {project.scopeFeatures || project.description || 'Deliverables as per work agreement.'}
              </p>
            </div>

            <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200 space-y-1.5">
              <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                <span>⚠️</span> Client Additions ("New Kya Add Karwaya")
              </h4>
              <p className="text-xs text-amber-950 whitespace-pre-wrap leading-relaxed">
                {project.changeRequests || 'No additional change requests recorded.'}
              </p>
              {project.extraTimeRequired && (
                <div className="pt-1.5 border-t border-amber-200/80 flex items-center justify-between text-[11px]">
                  <span className="font-bold text-amber-900">Extra Time Added:</span>
                  <span className="font-black text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-200">
                    ⏱️ {project.extraTimeRequired}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Commercials Summary */}
          <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-200 print-avoid-break">
            <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 mb-2">
              💰 Financials &amp; Payment Status
            </h4>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-bold block">Total Budget</span>
                <span className="font-extrabold text-base text-gray-900">{project.budget || '₹ Custom'}</span>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-bold block">Received</span>
                <span className="font-extrabold text-base text-emerald-600">{project.paymentReceived || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-bold block">Pending</span>
                <span className="font-extrabold text-base text-amber-600">{project.paymentPending || '—'}</span>
              </div>
            </div>
            {project.paymentNotes && (
              <p className="text-[11px] text-gray-500 mt-2 border-t border-gray-200 pt-1.5">
                Notes: {project.paymentNotes}
              </p>
            )}
          </div>

          {/* Technical Links */}
          {(project.liveUrl || project.stagingUrl || project.repoUrl) && (
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center gap-4 text-xs flex-wrap print-avoid-break">
              <span className="font-bold text-gray-500">Links:</span>
              {project.liveUrl && (
                <span className="text-brand-blue font-mono text-[11px]">Live: {project.liveUrl}</span>
              )}
              {project.stagingUrl && (
                <span className="text-amber-700 font-mono text-[11px]">Demo: {project.stagingUrl}</span>
              )}
              {project.repoUrl && (
                <span className="text-purple-700 font-mono text-[11px]">Repo: {project.repoUrl}</span>
              )}
            </div>
          )}

          {/* Print Footer */}
          <div className="pt-4 border-t border-gray-200 flex justify-between items-center text-[10px] text-gray-400 print-avoid-break">
            <p>SnapTech Digital &bull; Confidential Management Documentation</p>
            <p>Printed by Project Lead / Management</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function generateMasterReportHTML(projects, stats) {
  const generatedDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  let html = `
    <div class="header-bar">
      <div>
        <h1 class="brand-title">SnapTech Digital</h1>
        <p class="brand-subtitle">Software Development &bull; Engineering Status Report</p>
      </div>
      <div>
        <span class="badge-report">EXECUTIVE MANAGEMENT REPORT</span>
        <div class="report-date">Generated: ${escapePrintHtml(generatedDate)}</div>
      </div>
    </div>

    <!-- KPI Summary -->
    <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 14px;">
      <div class="card bg-gray" style="text-align: center; margin-bottom: 0;">
        <span class="grid-label">Total Projects</span>
        <span style="font-size: 18px; font-weight: 900; color: #0f172a;">${stats.total}</span>
      </div>
      <div class="card bg-blue" style="text-align: center; margin-bottom: 0;">
        <span class="grid-label" style="color: #1B6EF3;">In Development</span>
        <span style="font-size: 18px; font-weight: 900; color: #1B6EF3;">${stats.active}</span>
      </div>
      <div class="card bg-amber" style="text-align: center; margin-bottom: 0;">
        <span class="grid-label" style="color: #d97706;">In Review / QA</span>
        <span style="font-size: 18px; font-weight: 900; color: #d97706;">${stats.review}</span>
      </div>
      <div class="card" style="text-align: center; margin-bottom: 0; background: #ecfdf5; border-color: #a7f3d0;">
        <span class="grid-label" style="color: #059669;">Completed</span>
        <span style="font-size: 18px; font-weight: 900; color: #059669;">${stats.completed}</span>
      </div>
      <div class="card" style="text-align: center; margin-bottom: 0; background: #fff1f2; border-color: #fecdd3;">
        <span class="grid-label" style="color: #e11d48;">Overdue SLA</span>
        <span style="font-size: 18px; font-weight: 900; color: #e11d48;">${stats.overdue}</span>
      </div>
    </div>

    <!-- Table -->
    <div class="card" style="padding: 0; overflow: hidden; margin-bottom: 12px;">
      <table>
        <thead>
          <tr>
            <th style="width: 32px;">#</th>
            <th>Project Title</th>
            <th>Client</th>
            <th>Dev Stage</th>
            <th>Assigned Team</th>
            <th>Progress</th>
            <th>Deadline</th>
            <th>Budget / Payment</th>
            <th>Current Scene / Status</th>
          </tr>
        </thead>
        <tbody>
  `

  projects.forEach((p, idx) => {
    const stage = STAGE_MAP[p.devStage] || DEV_STAGES[0]
    const stageName = stage.label.split('. ')[1] || stage.label
    const deadlineStr = p.deadline ? new Date(p.deadline).toLocaleDateString('en-IN') : 'N/A'
    const statusNote = p.currentStatusNote || p.notes || '—'

    html += `
      <tr>
        <td style="color: #94a3b8; font-weight: 700;">${idx + 1}</td>
        <td>
          <strong style="color: #0f172a;">${escapePrintHtml(p.projectTitle)}</strong>
          <div style="font-size: 10px; color: #64748b;">${escapePrintHtml(formatProjectType(p.projectType))}</div>
        </td>
        <td>${escapePrintHtml(p.clientName)}</td>
        <td>
          <span style="background: #eff6ff; color: #1B6EF3; border: 1px solid #bfdbfe; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 10px;">
            ${escapePrintHtml(stageName)}
          </span>
        </td>
        <td style="color: #475569;">${escapePrintHtml(p.assignedTo || 'Unassigned')}</td>
        <td style="font-family: monospace; font-weight: 700; color: #1B6EF3;">${p.progress}%</td>
        <td>
          <div style="font-weight: 700;">${escapePrintHtml(deadlineStr)}</div>
          ${p.timeRemainingEstimate ? `<div style="font-size: 9px; color: #4338ca; font-weight: 700;">⏱️ ~${escapePrintHtml(p.timeRemainingEstimate)}</div>` : ''}
        </td>
        <td>
          <div style="font-weight: 700;">${escapePrintHtml(p.budget || '—')}</div>
          <div style="font-size: 10px; color: #64748b;">${escapePrintHtml(p.paymentReceived ? `Rec: ${p.paymentReceived}` : formatPaymentStatus(p.paymentStatus))}</div>
        </td>
        <td style="max-width: 220px;">
          <div style="font-size: 11px; color: #334155;">${escapePrintHtml(statusNote)}</div>
          ${p.changeRequests ? `<div style="font-size: 10px; color: #b45309; font-weight: 700; margin-top: 2px;">+Scope: ${escapePrintHtml(p.changeRequests)}</div>` : ''}
        </td>
      </tr>
    `
  })

  html += `
        </tbody>
      </table>
    </div>

    <div class="footer">
      <div>SnapTech Digital &bull; Confidential Executive Document</div>
      <div>Report Compiled for Management &amp; Boss Review</div>
    </div>
  `

  return html
}

// ── Master Portfolio Printable Report Modal (Print All Projects) ─
function PrintMasterReportModal({ projects = [], onClose }) {
  if (!projects) return null

  const stats = {
    total: projects.length,
    active: projects.filter((p) => p.status === 'IN_PROGRESS' || p.status === 'PLANNING').length,
    review: projects.filter((p) => p.status === 'REVIEW').length,
    completed: projects.filter((p) => p.status === 'COMPLETED').length,
    overdue: projects.filter((p) => {
      if (!p.deadline || p.status === 'COMPLETED') return false
      return new Date(p.deadline) < new Date()
    }).length,
  }

  const handlePrint = () => {
    const html = generateMasterReportHTML(projects, stats)
    printHtmlDocument('SnapTech Digital - Master Development Report', html, true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[94vh] overflow-y-auto border border-gray-200">
        {/* Controls Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <Printer className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-extrabold text-gray-900">Company Master Development Report</h3>
              <p className="text-xs text-gray-500">Executive multi-project status report for Boss &amp; Management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Master Report Body */}
        <div className="space-y-6 text-gray-900 font-sans print:space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-brand-blue pb-4">
            <div>
              <h1 className="text-2xl font-black text-brand-blue tracking-tight">SnapTech Digital</h1>
              <p className="text-xs text-gray-500 mt-0.5">Software Development &bull; Engineering Status Report</p>
            </div>
            <div className="text-right text-xs">
              <span className="px-2.5 py-1 bg-gray-100 font-bold rounded-lg border border-gray-200 text-gray-800">
                EXECUTIVE MANAGEMENT REPORT
              </span>
              <p className="text-[11px] text-gray-400 mt-1.5">
                Generated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Executive KPI Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase block">Total Projects</span>
              <span className="text-xl font-black text-gray-900">{stats.total}</span>
            </div>
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-center">
              <span className="text-[10px] font-bold text-brand-blue uppercase block">In Development</span>
              <span className="text-xl font-black text-brand-blue">{stats.active}</span>
            </div>
            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-center">
              <span className="text-[10px] font-bold text-amber-700 uppercase block">In Review / QA</span>
              <span className="text-xl font-black text-amber-700">{stats.review}</span>
            </div>
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 text-center">
              <span className="text-[10px] font-bold text-emerald-700 uppercase block">Completed</span>
              <span className="text-xl font-black text-emerald-700">{stats.completed}</span>
            </div>
            <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200 text-center">
              <span className="text-[10px] font-bold text-rose-700 uppercase block">Overdue SLA</span>
              <span className={`text-xl font-black ${stats.overdue > 0 ? 'text-rose-700' : 'text-gray-400'}`}>
                {stats.overdue}
              </span>
            </div>
          </div>

          {/* Master Table */}
          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-gray-100 text-gray-700 uppercase tracking-wider text-[10px] font-bold border-b border-gray-200">
                <tr>
                  <th className="p-2.5">#</th>
                  <th className="p-2.5">Project Title</th>
                  <th className="p-2.5">Client</th>
                  <th className="p-2.5">Dev Stage</th>
                  <th className="p-2.5">Assigned Team</th>
                  <th className="p-2.5">Progress</th>
                  <th className="p-2.5">Deadline</th>
                  <th className="p-2.5">Budget / Payment</th>
                  <th className="p-2.5">Current Scene / Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150">
                {projects.map((p, idx) => {
                  const stage = STAGE_MAP[p.devStage] || DEV_STAGES[0]
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/60 transition-colors print-avoid-break">
                      <td className="p-2.5 font-bold text-gray-400">{idx + 1}</td>
                      <td className="p-2.5 font-bold text-gray-900 max-w-[190px]">
                        <div>{p.projectTitle}</div>
                        <span className="text-[10px] text-gray-500 font-normal block mt-0.5">
                          {formatProjectType(p.projectType)}
                        </span>
                      </td>
                      <td className="p-2.5 text-gray-700 font-medium">{p.clientName}</td>
                      <td className="p-2.5">
                        <span className="px-1.5 py-0.5 rounded font-bold text-[10px] bg-blue-50 text-brand-blue border border-blue-200">
                          {stage.label.split('. ')[1] || stage.label}
                        </span>
                      </td>
                      <td className="p-2.5 text-gray-600 max-w-[140px] truncate" title={p.assignedTo}>
                        {p.assignedTo || 'Unassigned'}
                      </td>
                      <td className="p-2.5 font-mono font-bold text-brand-blue">{p.progress}%</td>
                      <td className="p-2.5 whitespace-nowrap">
                        <span className="font-bold text-gray-900 block">
                          {p.deadline ? new Date(p.deadline).toLocaleDateString('en-IN') : 'N/A'}
                        </span>
                        {p.timeRemainingEstimate && (
                          <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1 rounded block mt-0.5">
                            ⏱️ ~{p.timeRemainingEstimate}
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 whitespace-nowrap">
                        <span className="font-bold text-gray-900 block">{p.budget || '—'}</span>
                        <span className="text-[10px] text-gray-500">
                          {p.paymentReceived ? `Rec: ${p.paymentReceived}` : formatPaymentStatus(p.paymentStatus)}
                        </span>
                      </td>
                      <td className="p-2.5 text-[11px] text-gray-700 max-w-[220px]">
                        <p className="line-clamp-2">{p.currentStatusNote || p.notes || '—'}</p>
                        {p.changeRequests && (
                          <p className="text-[10px] text-amber-700 font-bold mt-0.5 line-clamp-1">
                            +Scope: {p.changeRequests}
                            {p.extraTimeRequired && ` (${p.extraTimeRequired})`}
                          </p>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-gray-200 flex justify-between items-center text-[10px] text-gray-400">
            <p>SnapTech Digital &bull; Confidential Executive Document</p>
            <p>Report Compiled for Management &amp; Boss Review</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Dashboard Page Component ───────────────────────────────
export default function AdminClientProjectsPage() {
  const qc = useQueryClient()
  const toast = useToast()

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [stageFilter, setStageFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [healthFilter, setHealthFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [quickViewProject, setQuickViewProject] = useState(null)
  const [printSingleProject, setPrintSingleProject] = useState(null)
  const [showMasterReport, setShowMasterReport] = useState(false)

  // Confirm delete modal
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    id: null,
    title: '',
  })

  // Queries
  const { data: projects = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-client-projects'],
    queryFn: () => api.get('/admin/client-projects').then((r) => r.data || []),
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => api.post('/admin/client-projects', data),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin-client-projects'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
      setShowForm(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      toast.success('Project added to company tracker successfully!')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to add project.')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/admin/client-projects/${id}`, data),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin-client-projects'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
      setEditing(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      toast.success('Project details updated successfully!')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to update project.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/client-projects/${id}`),
    onSuccess: (_, deletedId) => {
      toast.info('Project removed from system.')
      qc.setQueryData(['admin-client-projects'], (old) => {
        if (!Array.isArray(old)) return old
        return old.filter((p) => p.id !== deletedId)
      })
      qc.invalidateQueries({ queryKey: ['admin-client-projects'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
      setDeleteConfirm({ isOpen: false, id: null, title: '' })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete project.')
    },
  })

  const handleAttachmentChange = () => {
    qc.invalidateQueries({ queryKey: ['admin-client-projects'] })
  }

  // Summary statistics
  const stats = useMemo(() => {
    const total = projects.length
    const active = projects.filter((p) => p.status === 'IN_PROGRESS' || p.status === 'PLANNING').length
    const review = projects.filter((p) => p.status === 'REVIEW').length
    const completed = projects.filter((p) => p.status === 'COMPLETED').length
    const overdue = projects.filter((p) => {
      if (!p.deadline || p.status === 'COMPLETED') return false
      return new Date(p.deadline) < new Date()
    }).length
    return { total, active, review, completed, overdue }
  }, [projects])

  // Dynamic list of unique project types for filter dropdown
  const availableTypes = useMemo(() => {
    const set = new Set()
    projects.forEach((p) => {
      if (p.projectType) set.add(formatProjectType(p.projectType))
    })
    return Array.from(set).sort()
  }, [projects])

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const q = searchTerm.toLowerCase()
      const matchesSearch =
        searchTerm === '' ||
        p.projectTitle?.toLowerCase().includes(q) ||
        p.clientName?.toLowerCase().includes(q) ||
        p.assignedTo?.toLowerCase().includes(q) ||
        p.projectType?.toLowerCase().includes(q) ||
        p.paymentStatus?.toLowerCase().includes(q) ||
        p.initialRequirement?.toLowerCase().includes(q) ||
        p.scopeFeatures?.toLowerCase().includes(q) ||
        p.changeRequests?.toLowerCase().includes(q) ||
        p.extraTimeRequired?.toLowerCase().includes(q) ||
        p.timeRemainingEstimate?.toLowerCase().includes(q) ||
        p.currentStatusNote?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        (Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(q)))

      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter
      const matchesStage = stageFilter === 'ALL' || p.devStage === stageFilter
      const matchesPriority = priorityFilter === 'ALL' || p.priority === priorityFilter
      const matchesHealth = healthFilter === 'ALL' || p.health === healthFilter
      const matchesType = typeFilter === 'ALL' || formatProjectType(p.projectType) === typeFilter

      return matchesSearch && matchesStatus && matchesStage && matchesPriority && matchesHealth && matchesType
    })
  }, [projects, searchTerm, statusFilter, stageFilter, priorityFilter, healthFilter, typeFilter])

  // Deadline calculation
  const calculateDaysLeft = (deadlineStr) => {
    if (!deadlineStr) return { text: 'No Target Date', color: 'bg-gray-100 text-gray-500 border-gray-200' }
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

  // Export to Excel / CSV
  const handleExportCSV = () => {
    if (!projects || projects.length === 0) {
      toast.info('No projects to export.')
      return
    }

    const headers = [
      'Project Title',
      'Client Name',
      'Client Contact',
      'Project Type',
      'Development Stage',
      'Status',
      'Health',
      'Priority',
      'Progress (%)',
      'Assigned Team',
      'Start Date',
      'Deadline',
      'Time Remaining (Kitna Time Aur Lagega)',
      'Budget',
      'Payment Status',
      'Payment Received',
      'Payment Pending',
      'Payment Notes',
      'Initial Requirement (Pehle Kya Tha)',
      'Scope Deliverables (Kya Banana Hai)',
      'Client Changes (New Kya Add Hua)',
      'Extra Time Added (Delay Impact)',
      'Latest Status Scene',
      'Live URL',
      'Staging URL',
      'Repo URL',
    ]

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""'
      return `"${String(str).replace(/"/g, '""')}"`
    }

    const rows = filteredProjects.map((p) => {
      const stage = STAGE_MAP[p.devStage]?.label || p.devStage || ''
      const type = formatProjectType(p.projectType)
      return [
        escapeCsv(p.projectTitle),
        escapeCsv(p.clientName),
        escapeCsv(p.clientContact),
        escapeCsv(type),
        escapeCsv(stage),
        escapeCsv(STATUS_LABELS[p.status] || p.status),
        escapeCsv(HEALTH_LABELS[p.health] || p.health),
        escapeCsv(p.priority),
        p.progress || 0,
        escapeCsv(p.assignedTo),
        escapeCsv(p.startDate ? new Date(p.startDate).toLocaleDateString('en-IN') : ''),
        escapeCsv(p.deadline ? new Date(p.deadline).toLocaleDateString('en-IN') : ''),
        escapeCsv(p.timeRemainingEstimate || ''),
        escapeCsv(p.budget),
        escapeCsv(formatPaymentStatus(p.paymentStatus)),
        escapeCsv(p.paymentReceived),
        escapeCsv(p.paymentPending),
        escapeCsv(p.paymentNotes),
        escapeCsv(p.initialRequirement),
        escapeCsv(p.scopeFeatures || p.description),
        escapeCsv(p.changeRequests),
        escapeCsv(p.extraTimeRequired),
        escapeCsv(p.currentStatusNote || p.notes),
        escapeCsv(p.liveUrl),
        escapeCsv(p.stagingUrl),
        escapeCsv(p.repoUrl),
      ].join(',')
    })

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `SnapTech_Company_Projects_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Excel CSV export downloaded successfully!')
  }

  return (
    <>
      <SEO
        title="Company Development Projects Tracker — Admin"
        description="Comprehensive development projects tracking, team allocation, stage lifecycles, change requests, and executive management reporting."
      />

      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* ── Top Header Section ─────────────────────────────────── */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-gray-200 pb-5">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-brand-blue/10 flex items-center justify-center shrink-0 text-brand-blue shadow-2xs">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold font-heading text-gray-900 tracking-tight">
                Company Development Projects Tracker
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Internal &bull; Client Projects &bull; Lifecycle Stages &bull; Assigned Team &bull; Management Reports
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 flex-nowrap shrink-0">
            {/* Export to Excel Button */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 sm:gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 hover:-translate-y-0.5 transition-all cursor-pointer whitespace-nowrap"
              title="Download Excel spreadsheet of projects"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel Export</span>
            </button>

            {/* Master Report (Print All) */}
            <button
              onClick={() => setShowMasterReport(true)}
              className="flex items-center gap-1.5 sm:gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 hover:-translate-y-0.5 transition-all cursor-pointer whitespace-nowrap"
              title="Print All Projects Master Executive Report for Management"
            >
              <Printer className="w-4 h-4" />
              <span>Print Master Report</span>
            </button>

            {/* Add New Project Button */}
            <button
              onClick={() => {
                setEditing(null)
                setShowForm(!showForm)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="flex items-center gap-1.5 sm:gap-2 bg-brand-blue hover:bg-blue-600 text-white px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-brand-blue/20 hover:-translate-y-0.5 transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>{showForm ? 'Close Form' : 'Add Project'}</span>
            </button>
          </div>
        </div>

        {/* ── Summary KPI Metric Cards ───────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-700 border border-gray-200 flex items-center justify-center shrink-0">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Projects</p>
              <p className="text-xl font-black text-gray-900">{isLoading ? '…' : stats.total}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-blue border border-blue-100 flex items-center justify-center shrink-0">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-brand-blue uppercase tracking-wider">In Development</p>
              <p className="text-xl font-black text-brand-blue">{isLoading ? '…' : stats.active}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">In Review / QA</p>
              <p className="text-xl font-black text-amber-700">{isLoading ? '…' : stats.review}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Completed</p>
              <p className="text-xl font-black text-emerald-600">{isLoading ? '…' : stats.completed}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3 col-span-2 sm:col-span-1">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              stats.overdue > 0 ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-gray-50 text-gray-400 border-gray-200'
            }`}>
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Overdue SLA</p>
              <p className={`text-xl font-black ${stats.overdue > 0 ? 'text-rose-600' : 'text-gray-900'}`}>
                {isLoading ? '…' : stats.overdue}
              </p>
            </div>
          </div>
        </div>

        {/* ── Project Form Panel ─────────────────────────────────── */}
        {(showForm || editing) && (
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-gray-200 shadow-xl space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-base sm:text-lg font-extrabold font-heading text-gray-900 flex items-center gap-2">
                <span>{showForm ? '➕' : '✏️'}</span>
                <span>{showForm ? 'Add New Development Project' : `Edit: ${editing?.projectTitle}`}</span>
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

            <ProjectForm
              initial={editing}
              onSave={(data) => {
                if (editing) {
                  updateMutation.mutate({ id: editing.id, ...data })
                } else {
                  createMutation.mutate(data)
                }
              }}
              onCancel={() => {
                setShowForm(false)
                setEditing(null)
              }}
              loading={createMutation.isPending || updateMutation.isPending}
              onAttachmentChange={handleAttachmentChange}
            />
          </div>
        )}

        {/* ── Search & Filter Controls ───────────────────────────── */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by project title, client, assigned developer, tech stack, notes..."
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
              {/* Dev Stage Filter */}
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="px-3 py-2 text-xs font-semibold border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none"
              >
                <option value="ALL">All Dev Stages</option>
                {DEV_STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
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

              {/* Health Filter */}
              <select
                value={healthFilter}
                onChange={(e) => setHealthFilter(e.target.value)}
                className="px-3 py-2 text-xs font-semibold border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none"
              >
                <option value="ALL">All Health</option>
                <option value="ON_TRACK">🟢 On Track</option>
                <option value="AT_RISK">🟡 At Risk</option>
                <option value="DELAYED">🔴 Delayed</option>
              </select>

              {/* Dynamic Project Type Filter */}
              {availableTypes.length > 0 && (
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none"
                >
                  <option value="ALL">All Project Types ({availableTypes.length})</option>
                  {availableTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              )}

              {(searchTerm || statusFilter !== 'ALL' || stageFilter !== 'ALL' || healthFilter !== 'ALL' || typeFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('ALL')
                    setStageFilter('ALL')
                    setHealthFilter('ALL')
                    setPriorityFilter('ALL')
                    setTypeFilter('ALL')
                  }}
                  className="px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-100 font-semibold transition-all cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Project Cards Grid ─────────────────────────────────── */}
        {isLoading ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 shadow-xs">
            <RefreshCw className="w-8 h-8 text-brand-blue animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-700">Loading development projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 shadow-xs space-y-3">
            <FolderOpen className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="text-base font-bold text-gray-800">No development projects found</p>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'ALL' || stageFilter !== 'ALL'
                ? 'Try adjusting your search criteria or resetting filters.'
                : 'Click "Add Project" to record your company\'s first development project.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((p) => {
              const deadlineStatus = calculateDaysLeft(p.deadline)
              const stage = STAGE_MAP[p.devStage] || DEV_STAGES[0]
              const typeLabel = formatProjectType(p.projectType)

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between p-5 group hover:border-brand-blue/40 space-y-4"
                >
                  <div className="space-y-3">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3
                          onClick={() => setQuickViewProject(p)}
                          className="font-extrabold font-heading text-sm sm:text-base text-gray-900 line-clamp-2 hover:text-brand-blue transition-colors cursor-pointer leading-snug"
                          title={p.projectTitle}
                        >
                          {p.projectTitle}
                        </h3>
                        <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1 font-medium flex-wrap">
                          <Building2 className="w-3 h-3 text-gray-400 shrink-0" />
                          <strong className="text-gray-800">{p.clientName}</strong>
                          {p.clientContact && <span className="text-gray-400">({p.clientContact})</span>}
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

                    {/* Development Stage Badge & Project Type */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md border border-gray-200">
                        {typeLabel}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 ${stage.color}`}>
                        <span>{stage.icon}</span>
                        <span>{stage.label}</span>
                      </span>
                      {p.health && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                            HEALTH_COLORS[p.health] || HEALTH_COLORS.ON_TRACK
                          }`}
                        >
                          {HEALTH_LABELS[p.health] || p.health}
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold">
                        <span className="text-gray-500">Progress</span>
                        <span className="font-mono font-bold text-brand-blue">{p.progress}%</span>
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

                    {/* Assigned Developers Box */}
                    <div className="bg-gray-50/80 p-2.5 rounded-xl border border-gray-100 space-y-1">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        <User className="w-3 h-3 text-indigo-500" />
                        <span>Assigned Team:</span>
                      </div>
                      <p className="text-xs font-bold text-gray-900 line-clamp-1" title={p.assignedTo}>
                        {p.assignedTo || 'Unassigned / Needs Allocation'}
                      </p>
                    </div>

                    {/* Commercials & Financials Row */}
                    {(p.budget || p.paymentReceived || p.paymentPending || p.paymentStatus) && (
                      <div className="bg-emerald-50/40 p-2 rounded-xl border border-emerald-100 flex items-center justify-between text-xs flex-wrap gap-1">
                        <div className="flex items-center gap-1 text-emerald-800 font-bold">
                          <DollarSign className="w-3 h-3" />
                          <span>{p.budget || 'Custom'}</span>
                        </div>
                        <div className="text-[10px] text-gray-600 flex items-center gap-1.5 flex-wrap">
                          {p.paymentReceived && <span className="text-emerald-700 font-bold">Rec: {p.paymentReceived}</span>}
                          {p.paymentPending && <span className="text-amber-700 font-bold">Pend: {p.paymentPending}</span>}
                          {p.paymentStatus && (
                            <span className="text-gray-600 bg-white px-1.5 py-0.5 rounded border border-gray-200 font-medium">
                              {formatPaymentStatus(p.paymentStatus)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Change Requests Alert (If Client added new things) */}
                    {p.changeRequests && (
                      <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold flex items-center gap-1 text-[10px] uppercase text-amber-800">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            Scope Additions:
                          </span>
                          {p.extraTimeRequired && (
                            <span className="text-[9px] font-black text-rose-700 bg-white px-1.5 py-0.5 rounded border border-rose-200">
                              ⏱️ {p.extraTimeRequired}
                            </span>
                          )}
                        </div>
                        <p className="line-clamp-2 font-medium text-amber-950">{p.changeRequests}</p>
                      </div>
                    )}

                    {/* Latest Status Scene ("Kya Scene Hai") */}
                    {(p.currentStatusNote || p.notes) && (
                      <div className="bg-blue-50/30 p-2 rounded-xl border border-blue-100/70 text-[11px] text-gray-700 line-clamp-2">
                        <strong className="text-brand-blue font-bold">Scene: </strong>
                        {p.currentStatusNote || p.notes}
                      </div>
                    )}

                    {/* Deployment URLs */}
                    {(p.liveUrl || p.stagingUrl || p.repoUrl) && (
                      <div className="flex items-center gap-1.5 flex-wrap text-[10px] pt-1">
                        {p.liveUrl && (
                          <a
                            href={p.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-0.5 bg-blue-50 text-brand-blue hover:bg-blue-100 rounded-md border border-blue-200 flex items-center gap-1 font-semibold"
                          >
                            <Globe className="w-2.5 h-2.5" />
                            Live
                          </a>
                        )}
                        {p.stagingUrl && (
                          <a
                            href={p.stagingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-0.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-md border border-amber-200 flex items-center gap-1 font-semibold"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            Demo
                          </a>
                        )}
                        {p.repoUrl && (
                          <a
                            href={p.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-0.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-md border border-purple-200 flex items-center gap-1 font-semibold"
                          >
                            <Code2 className="w-2.5 h-2.5" />
                            Repo
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Actions Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border ${deadlineStatus.color}`}
                      >
                        {deadlineStatus.text}
                      </span>
                      {p.timeRemainingEstimate && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                          ⏱️ ~{p.timeRemainingEstimate}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Individual Project Print Sheet */}
                      <button
                        onClick={() => setPrintSingleProject(p)}
                        className="text-gray-500 hover:text-indigo-600 p-1.5 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                        title="Print Single Project Sheet (Management PDF)"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      {/* Quick Inspect View */}
                      <button
                        onClick={() => setQuickViewProject(p)}
                        className="text-gray-500 hover:text-brand-blue p-1.5 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                        title="View Full Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Edit Project */}
                      <button
                        onClick={() => {
                          setEditing(p)
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        className="text-gray-500 hover:text-brand-blue p-1.5 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                        title="Edit Project"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      {/* Delete Project */}
                      <button
                        onClick={() =>
                          setDeleteConfirm({
                            isOpen: true,
                            id: p.id,
                            title: p.projectTitle,
                          })
                        }
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

      {/* ── Quick Inspect Modal ─────────────────────────────────── */}
      {quickViewProject && (() => {
        const qv = quickViewProject
        const stageObj = STAGE_MAP[qv.devStage] || DEV_STAGES[0]
        const typeLabel = formatProjectType(qv.projectType)
        const paymentLabel = formatPaymentStatus(qv.paymentStatus)
        const daysInfo = calculateDaysLeft(qv.deadline)

        const tagsList = Array.isArray(qv.tags)
          ? qv.tags
          : typeof qv.tags === 'string'
            ? qv.tags.split(',').map((t) => t.trim()).filter(Boolean)
            : []

        const teamList = qv.assignedTo
          ? qv.assignedTo.split(',').map((m) => m.trim()).filter(Boolean)
          : []

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/65 backdrop-blur-md animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl flex flex-col border border-gray-200 max-h-[92vh] overflow-hidden">
              {/* Modal Top Header (Sticky) */}
              <div className="px-5 py-4 sm:px-7 sm:py-5 border-b border-gray-100 flex items-start justify-between gap-4 bg-white/95 backdrop-blur-sm z-10">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-lg bg-blue-50 text-brand-blue border border-blue-200/80">
                      {typeLabel}
                    </span>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${STATUS_COLORS[qv.status] || 'bg-gray-100 text-gray-700'}`}>
                      {STATUS_LABELS[qv.status] || qv.status}
                    </span>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${PRIORITY_COLORS[qv.priority] || 'bg-gray-100 text-gray-700'}`}>
                      Priority: {qv.priority}
                    </span>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${HEALTH_COLORS[qv.health] || 'bg-gray-100 text-gray-700'}`}>
                      Health: {HEALTH_LABELS[qv.health] || qv.health}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black font-heading text-gray-900 tracking-tight break-words">
                    {qv.projectTitle}
                  </h2>

                  <div className="flex items-center gap-2 sm:gap-4 text-xs text-gray-600 flex-wrap">
                    <span className="flex items-center gap-1.5 font-bold text-gray-900">
                      <Building2 className="w-3.5 h-3.5 text-brand-blue" />
                      {qv.clientName}
                    </span>
                    {qv.clientContact && (
                      <span className="flex items-center gap-1 text-gray-600 font-medium bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200">
                        <span>📞/✉️</span> {qv.clientContact}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <button
                    onClick={() => {
                      const target = qv
                      setQuickViewProject(null)
                      setEditing(target)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-brand-blue font-bold text-xs rounded-xl transition-all cursor-pointer border border-blue-200"
                    title="Edit Project Details"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>
                  <button
                    onClick={() => {
                      const target = qv
                      setQuickViewProject(null)
                      setPrintSingleProject(target)
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all cursor-pointer border border-gray-200"
                    title="Print PDF / Single Sheet"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Print PDF</span>
                  </button>
                  <button
                    onClick={() => setQuickViewProject(null)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
                {/* Progress & Live Schedule Grid */}
                <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-2xl p-4 border border-gray-200 space-y-3.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-brand-blue" />
                      <span className="text-xs font-black uppercase tracking-wider text-gray-700">
                        Stage: <span className="text-brand-blue">{stageObj.label}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-bold">Overall Progress:</span>
                      <span className="text-sm font-black text-emerald-600 bg-white px-2.5 py-0.5 rounded-lg border border-emerald-200 shadow-2xs">
                        {qv.progress}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="bg-gradient-to-r from-brand-blue via-indigo-600 to-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, qv.progress))}%` }}
                    />
                  </div>

                  {/* 4-Item Timeline Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 text-xs border-t border-gray-200/60">
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200/80 shadow-2xs">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Start Date</span>
                      <p className="font-bold text-gray-800 mt-0.5">
                        {qv.startDate ? new Date(qv.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </p>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-gray-200/80 shadow-2xs">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Target Deadline</span>
                      <p className="font-bold text-gray-900 mt-0.5">
                        {qv.deadline ? new Date(qv.deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                      </p>
                      {qv.deadline && (
                        <span className={`text-[10px] inline-block px-1.5 py-0.5 rounded mt-1 border ${daysInfo.color}`}>
                          {daysInfo.text}
                        </span>
                      )}
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-indigo-200 shadow-2xs">
                      <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Time Remaining</span>
                      <p className="text-xs font-black text-indigo-900 mt-0.5">
                        {qv.timeRemainingEstimate || 'On Schedule'}
                      </p>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-amber-200 shadow-2xs">
                      <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Extra Time (Additions)</span>
                      <p className="text-xs font-black text-rose-700 mt-0.5">
                        {qv.extraTimeRequired ? `+ ${qv.extraTimeRequired}` : 'None'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Financials & Payment Details ("Payment Ka Kya Seen Hai") */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2.5 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-800">
                        Commercials &amp; Payment Breakdown
                      </h4>
                    </div>
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Status: {paymentLabel}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Project Budget</span>
                      <p className="text-base font-black text-gray-900 mt-0.5">
                        {qv.budget ? (qv.budget.startsWith('₹') || qv.budget.startsWith('$') ? qv.budget : `₹ ${qv.budget}`) : '—'}
                      </p>
                    </div>

                    <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Payment Received</span>
                      <p className="text-base font-black text-emerald-700 mt-0.5">
                        {qv.paymentReceived ? (qv.paymentReceived.startsWith('₹') || qv.paymentReceived.startsWith('$') ? qv.paymentReceived : `₹ ${qv.paymentReceived}`) : '₹ 0'}
                      </p>
                    </div>

                    <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200">
                      <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Payment Pending</span>
                      <p className="text-base font-black text-amber-700 mt-0.5">
                        {qv.paymentPending ? (qv.paymentPending.startsWith('₹') || qv.paymentPending.startsWith('$') ? qv.paymentPending : `₹ ${qv.paymentPending}`) : '—'}
                      </p>
                    </div>
                  </div>

                  {qv.paymentNotes && (
                    <div className="pt-2 border-t border-gray-100 text-xs">
                      <span className="text-[11px] font-bold text-gray-500 uppercase block mb-0.5">Payment Terms / Notes:</span>
                      <p className="text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-200 leading-relaxed">
                        {qv.paymentNotes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Assigned Team & Tech Stack */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Team Allocation */}
                  <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs space-y-2">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                      <Users className="w-4 h-4 text-brand-blue" />
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-700">
                        Assigned Team &amp; Developers
                      </h4>
                    </div>
                    {teamList.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {teamList.map((member, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200"
                          >
                            <User className="w-3 h-3 text-slate-500" />
                            {member}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic pt-1">No specific team members assigned.</p>
                    )}
                  </div>

                  {/* Tech Stack */}
                  <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs space-y-2">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                      <Code2 className="w-4 h-4 text-purple-600" />
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-700">
                        Tech Stack &amp; Technologies
                      </h4>
                    </div>
                    {tagsList.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {tagsList.map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200/80"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic pt-1">No technology tags recorded.</p>
                    )}
                  </div>
                </div>

                {/* Current Live Scene (Highlighted Banner) */}
                <div className="bg-blue-50/80 rounded-2xl p-4 sm:p-5 border border-blue-200/90 shadow-2xs space-y-1.5">
                  <div className="flex items-center gap-2 text-brand-blue">
                    <Sparkles className="w-4 h-4" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider">
                      Current Project Scene &amp; Latest Update
                    </h4>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-800 font-medium whitespace-pre-wrap leading-relaxed">
                    {qv.currentStatusNote || qv.notes || 'Project is active. Regular progress is being made as per current milestones.'}
                  </p>
                </div>

                {/* 3 Process Detail Boxes: Pehle Kya Tha -> Kya Banana Hai -> New Kya Add Hua */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-gray-400" />
                    Project Process &amp; Scope Progression
                  </h4>

                  {/* Box 1: Initial Requirement ("Project Pehle Kya Tha") */}
                  <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        Project Background ("Project Pehle Kya Tha" — Initial Client Brief)
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {qv.initialRequirement || 'No prior system recorded. Started as a greenfield project from client brief.'}
                    </p>
                  </div>

                  {/* Box 2: Scope Deliverables ("Kya-Kya Banana Hai") */}
                  <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs space-y-1.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Agreed Deliverables ("Kya-Kya Banana Hai" — Scope of Work)
                    </span>
                    <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {qv.scopeFeatures || qv.description || 'Full scope agreed upon during technical proposal discussion.'}
                    </p>
                  </div>

                  {/* Box 3: Client Additions ("New Kya Add Karwaya") */}
                  <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200/90 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        Client Additions ("New Kya Add Karwaya" — Scope Revisions)
                      </span>
                      {qv.extraTimeRequired && (
                        <span className="text-[11px] font-black px-2.5 py-0.5 rounded-lg bg-white text-rose-700 border border-rose-200 shadow-2xs">
                          ⏱️ Additional Time: {qv.extraTimeRequired}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-amber-950 whitespace-pre-wrap leading-relaxed">
                      {qv.changeRequests || 'No mid-development client additions recorded.'}
                    </p>
                  </div>
                </div>

                {/* Links Section (Live, Demo, Repository) */}
                {(qv.liveUrl || qv.stagingUrl || qv.repoUrl) && (
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-2">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Link2 className="w-4 h-4" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">Project URLs &amp; Access</h4>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {qv.liveUrl && (
                        <a
                          href={qv.liveUrl.startsWith('http') ? qv.liveUrl : `https://${qv.liveUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-brand-blue rounded-xl text-xs font-bold border border-blue-200 transition-colors"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>Live Website</span>
                          <ExternalLink className="w-3 h-3 ml-0.5" />
                        </a>
                      )}
                      {qv.stagingUrl && (
                        <a
                          href={qv.stagingUrl.startsWith('http') ? qv.stagingUrl : `https://${qv.stagingUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold border border-amber-200 transition-colors"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>Staging / Demo</span>
                          <ExternalLink className="w-3 h-3 ml-0.5" />
                        </a>
                      )}
                      {qv.repoUrl && (
                        <a
                          href={qv.repoUrl.startsWith('http') ? qv.repoUrl : `https://${qv.repoUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-xl text-xs font-bold border border-purple-200 transition-colors"
                        >
                          <Code2 className="w-3.5 h-3.5" />
                          <span>Source Repository</span>
                          <ExternalLink className="w-3 h-3 ml-0.5" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Attachments Section if present */}
                {Array.isArray(qv.attachments) && qv.attachments.length > 0 && (
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-2">
                    <div className="flex items-center gap-1.5 text-gray-700">
                      <Paperclip className="w-4 h-4" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">Project Files &amp; Attachments ({qv.attachments.length})</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {qv.attachments.map((att) => (
                        <a
                          key={att.id}
                          href={att.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-gray-200 hover:border-brand-blue text-xs transition-colors"
                        >
                          <span className="font-semibold text-gray-800 truncate">{att.fileName}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-2" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer (Sticky) */}
              <div className="px-5 py-3.5 sm:px-7 border-t border-gray-100 flex items-center justify-between bg-gray-50/90 text-xs z-10">
                <span className="text-[11px] text-gray-400">
                  Added on: {qv.createdAt ? new Date(qv.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recently'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const target = qv
                      setQuickViewProject(null)
                      setPrintSingleProject(target)
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 font-bold rounded-xl cursor-pointer transition-all"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print PDF Sheet</span>
                  </button>
                  <button
                    onClick={() => setQuickViewProject(null)}
                    className="px-4 py-1.5 bg-gray-900 hover:bg-black text-white font-bold rounded-xl cursor-pointer transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Single Project Sheet Modal ─────────────────────────── */}
      {printSingleProject && (
        <PrintSingleProjectModal
          project={printSingleProject}
          onClose={() => setPrintSingleProject(null)}
        />
      )}

      {/* ── Master Report Modal ─────────────────────────────────── */}
      {showMasterReport && (
        <PrintMasterReportModal
          projects={filteredProjects}
          onClose={() => setShowMasterReport(false)}
        />
      )}

      {/* ── Delete Confirmation Modal ──────────────────────────── */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Project?"
        message={`Are you sure you want to permanently remove '${deleteConfirm.title}' from the tracker?`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={() => deleteMutation.mutate(deleteConfirm.id)}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: null, title: '' })}
      />
    </>
  )
}
