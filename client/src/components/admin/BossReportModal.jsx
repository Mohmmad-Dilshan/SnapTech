/**
 * BossReportModal.jsx — Executive Management & Daily Work Reporting Generator
 * Allows one-click generation of Daily Work Reports, Weekly Status, Client Summaries, and Project Deep-Dives for Management & Boss.
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  X,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Briefcase,
  User,
  FileSpreadsheet,
  Building2,
  RefreshCw,
} from 'lucide-react'
import { api } from '@/utils/api'

const getInitialStartDate = () => {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return d.toISOString().split('T')[0]
}
const getInitialEndDate = () => new Date().toISOString().split('T')[0]

export default function BossReportModal({ isOpen, onClose, projects = [], clients = [] }) {
  const [reportType, setReportType] = useState('DAILY') // DAILY | WEEKLY | CLIENT | PROJECT | CUSTOM
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [customStartDate, setCustomStartDate] = useState(getInitialStartDate)
  const [customEndDate, setCustomEndDate] = useState(getInitialEndDate)

  // Fetch compiled report from backend
  const { data: report, isLoading, refetch } = useQuery({
    queryKey: [
      'admin-boss-report',
      reportType,
      selectedProjectId,
      selectedClientId,
      customStartDate,
      customEndDate,
    ],
    queryFn: () => {
      const params = new URLSearchParams()
      params.append('reportType', reportType)
      if (reportType === 'CUSTOM') {
        params.append('startDate', customStartDate)
        params.append('endDate', customEndDate)
      }
      if (reportType === 'PROJECT' && selectedProjectId) {
        params.append('clientProjectId', selectedProjectId)
      }
      if (reportType === 'CLIENT' && selectedClientId) {
        params.append('clientId', selectedClientId)
      }
      return api.get(`/admin/reports/management?${params.toString()}`).then((r) => r.data)
    },
    enabled: isOpen,
  })

  if (!isOpen) return null

  const handlePrint = () => {
    window.print()
  }

  const handleExportCSV = () => {
    if (!report || !report.dailyLogs) return

    const headers = [
      'Date',
      'Project',
      'Client',
      'Author',
      'Work Completed Today',
      'Features Added',
      'Bugs Fixed',
      'Issues / Blockers',
      'Tomorrow Plan',
      'Hours',
    ]

    const rows = report.dailyLogs.map((log) => [
      `"${new Date(log.date).toLocaleDateString('en-IN')}"`,
      `"${(log.projectTitle || '').replace(/"/g, '""')}"`,
      `"${(log.clientName || '').replace(/"/g, '""')}"`,
      `"${(log.authorName || '').replace(/"/g, '""')}"`,
      `"${(log.workDone || '').replace(/"/g, '""')}"`,
      `"${(log.featuresAdded || '').replace(/"/g, '""')}"`,
      `"${(log.bugsFixed || '').replace(/"/g, '""')}"`,
      `"${(log.issuesEncountered || '').replace(/"/g, '""')}"`,
      `"${(log.nextDayPlan || '').replace(/"/g, '""')}"`,
      log.timeSpentHours || 0,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `SnapTech_Management_Report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const metrics = report?.metrics || {}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-5xl w-full p-5 sm:p-7 shadow-2xl flex flex-col max-h-[92vh] border border-gray-200">
        {/* Modal Controls Header (Hidden on Print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4 print:hidden">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-brand-blue/10 text-brand-blue rounded-xl">
                <Briefcase className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-extrabold font-heading text-gray-900">
                Boss &amp; Management Reporting Engine
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Generate executive work reports, daily updates, bugs resolved, and progress summaries for leadership.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={() => refetch()}
              className="p-2 text-gray-500 hover:text-brand-blue hover:bg-blue-50 rounded-xl transition-all cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleExportCSV}
              disabled={!report || (report.dailyLogs || []).length === 0}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-brand-blue hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Filter Selection Bar (Hidden on Print) */}
        <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 mt-4 flex flex-wrap gap-2.5 items-center justify-between print:hidden">
          {/* Report Type Tabs */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200/80 shadow-2xs overflow-x-auto">
            {[
              { id: 'DAILY', label: 'Today’s Work' },
              { id: 'WEEKLY', label: 'Past 7 Days' },
              { id: 'PROJECT', label: 'By Project' },
              { id: 'CLIENT', label: 'By Client' },
              { id: 'CUSTOM', label: 'Custom Range' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setReportType(tab.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  reportType === tab.id
                    ? 'bg-brand-blue text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Conditional Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {reportType === 'PROJECT' && (
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-xl bg-white text-gray-800 focus:outline-none"
              >
                <option value="">-- All Projects --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.projectTitle} ({p.clientName})
                  </option>
                ))}
              </select>
            )}

            {reportType === 'CLIENT' && (
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-xl bg-white text-gray-800 focus:outline-none"
              >
                <option value="">-- All Clients --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
            )}

            {reportType === 'CUSTOM' && (
              <div className="flex items-center gap-1.5 text-xs">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-2.5 py-1.5 border border-gray-200 rounded-xl bg-white text-xs font-mono"
                />
                <span className="text-gray-400">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-2.5 py-1.5 border border-gray-200 rounded-xl bg-white text-xs font-mono"
                />
              </div>
            )}
          </div>
        </div>

        {/* ── PRINTABLE REPORT BODY ───────────────────────────────── */}
        <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-6 print:overflow-visible print:p-0">
          {isLoading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-brand-blue animate-spin mx-auto" />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Compiling Management Work Report...
              </p>
            </div>
          ) : (
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-6 print:border-none print:shadow-none print:p-0">
              {/* Executive Document Header */}
              <div className="flex items-start justify-between border-b-2 border-brand-blue/20 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black font-heading tracking-tight text-gray-900">
                      <span className="text-brand-blue">SnapTech</span> Digital
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-brand-blue border border-blue-100">
                      A Hindustan Projects Enterprise
                    </span>
                  </div>
                  <h1 className="text-lg font-extrabold text-gray-900 mt-1">
                    {reportType === 'DAILY' && 'Daily Development & Executive Progress Report'}
                    {reportType === 'WEEKLY' && 'Weekly Executive Project Performance Status'}
                    {reportType === 'PROJECT' && 'Project Comprehensive 360° Audit & Work History'}
                    {reportType === 'CLIENT' && 'Client Portfolio & Deliverables Summary'}
                    {reportType === 'CUSTOM' && 'Custom Timeline Project Performance Report'}
                  </h1>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Report Generation Date:{' '}
                    <strong>{new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}</strong>
                  </p>
                </div>
                <div className="text-right text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 font-bold border border-gray-200">
                    Confidential Internal Report
                  </span>
                </div>
              </div>

              {/* KPI Metrics Dashboard Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200/80">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Total Hours Logged
                  </p>
                  <p className="text-xl font-black text-gray-900 mt-0.5 font-mono">
                    {metrics.totalHoursLogged || 0} hrs
                  </p>
                </div>
                <div className="bg-blue-50/60 p-3.5 rounded-2xl border border-blue-100">
                  <p className="text-[10px] font-bold text-brand-blue uppercase tracking-wider">
                    Work Updates Recorded
                  </p>
                  <p className="text-xl font-black text-brand-blue mt-0.5 font-mono">
                    {metrics.totalLogsCount || 0} entries
                  </p>
                </div>
                <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-100">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                    Completed Deliverables
                  </p>
                  <p className="text-xl font-black text-emerald-700 mt-0.5 font-mono">
                    {metrics.completedTasksCount || 0} tasks done
                  </p>
                </div>
                <div className={`p-3.5 rounded-2xl border ${
                  metrics.openIssuesCount > 0 ? 'bg-rose-50/60 border-rose-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">
                    Open Blockers / Bugs
                  </p>
                  <p className={`text-xl font-black mt-0.5 font-mono ${metrics.openIssuesCount > 0 ? 'text-rose-700' : 'text-gray-900'}`}>
                    {metrics.openIssuesCount || 0} issues
                  </p>
                </div>
              </div>

              {/* SECTION 1: Daily Work Log Chronological History */}
              <div className="space-y-3">
                <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
                  <Clock className="w-4 h-4 text-brand-blue" />
                  1. Daily Work Logs &amp; Tasks Completed Today
                </h3>

                {(!report?.dailyLogs || report.dailyLogs.length === 0) ? (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center text-xs text-gray-500">
                    No daily work updates logged in this reporting window.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {report.dailyLogs.map((log) => (
                      <div
                        key={log.id}
                        className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-2.5 break-inside-avoid"
                      >
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2 flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded-lg border border-gray-200 font-mono">
                              {new Date(log.date).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                            <span className="text-xs font-bold text-brand-blue">
                              {log.projectTitle}
                            </span>
                            <span className="text-xs text-gray-400">&bull;</span>
                            <span className="text-xs text-gray-600 font-medium">{log.clientName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-gray-500 flex items-center gap-1 font-medium">
                              <User className="w-3.5 h-3.5 text-gray-400" />
                              {log.authorName}
                            </span>
                            {log.timeSpentHours > 0 && (
                              <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                {log.timeSpentHours} hrs
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Work Done */}
                        <div>
                          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                            Work Completed Today:
                          </p>
                          <p className="text-xs text-gray-800 leading-relaxed font-medium">
                            {log.workDone}
                          </p>
                        </div>

                        {/* Features & Bugs Row */}
                        {(log.featuresAdded || log.bugsFixed) && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                            {log.featuresAdded && (
                              <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100/80">
                                <span className="font-bold text-brand-blue block text-[10px] uppercase">
                                  ✨ Features Developed:
                                </span>
                                <span className="text-gray-700">{log.featuresAdded}</span>
                              </div>
                            )}
                            {log.bugsFixed && (
                              <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/80">
                                <span className="font-bold text-emerald-700 block text-[10px] uppercase">
                                  🐛 Bugs Fixed:
                                </span>
                                <span className="text-gray-700">{log.bugsFixed}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Issues / Blockers & Next Day Plan */}
                        {(log.issuesEncountered || log.nextDayPlan) && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                            {log.issuesEncountered && (
                              <div className="bg-rose-50/50 p-2.5 rounded-xl border border-rose-100/80">
                                <span className="font-bold text-rose-700 block text-[10px] uppercase">
                                  ⚠️ Issues / Blockers:
                                </span>
                                <span className="text-gray-700">{log.issuesEncountered}</span>
                              </div>
                            )}
                            {log.nextDayPlan && (
                              <div className="bg-amber-50/50 p-2.5 rounded-xl border border-amber-100/80">
                                <span className="font-bold text-amber-800 block text-[10px] uppercase">
                                  🎯 Next Day Plan:
                                </span>
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

              {/* SECTION 2: Open Issues & Blockers Table */}
              <div className="space-y-3">
                <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  2. Open Blockers &amp; Bugs Requiring Management Attention
                </h3>

                {(!report?.openIssues || report.openIssues.length === 0) ? (
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center text-xs text-emerald-800 font-bold flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Zero open blockers or critical bugs reported. All projects are on track!
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-gray-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold">
                          <th className="p-3">Severity</th>
                          <th className="p-3">Issue Title &amp; Details</th>
                          <th className="p-3">Project / Client</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Assignee</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {report.openIssues.map((issue) => (
                          <tr key={issue.id} className="hover:bg-gray-50/50">
                            <td className="p-3">
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
                            </td>
                            <td className="p-3">
                              <p className="font-bold text-gray-900">{issue.title}</p>
                              {issue.description && (
                                <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{issue.description}</p>
                              )}
                            </td>
                            <td className="p-3">
                              <p className="font-bold text-gray-800">{issue.projectTitle}</p>
                              <p className="text-[10px] text-gray-500">{issue.clientName}</p>
                            </td>
                            <td className="p-3">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                                {issue.status}
                              </span>
                            </td>
                            <td className="p-3 text-gray-700 font-medium">
                              {issue.assignedTo || 'Unassigned'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* SECTION 3: Projects Status Overview Matrix */}
              <div className="space-y-3">
                <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
                  <Building2 className="w-4 h-4 text-purple-600" />
                  3. Client Projects Status &amp; Milestone Deadlines Overview
                </h3>

                <div className="overflow-x-auto rounded-2xl border border-gray-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold">
                        <th className="p-3">Project Title &amp; Client</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Health</th>
                        <th className="p-3">Progress</th>
                        <th className="p-3">Target Deadline</th>
                        <th className="p-3">Lead</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {report?.projects?.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50/50">
                          <td className="p-3">
                            <p className="font-bold text-gray-900">{p.projectTitle}</p>
                            <p className="text-[10px] text-gray-500 font-medium">{p.clientName}</p>
                          </td>
                          <td className="p-3 text-gray-700 font-medium">{p.projectType || 'Website'}</td>
                          <td className="p-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                              {p.status}
                            </span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                p.health === 'DELAYED'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : p.health === 'AT_RISK'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {p.health || 'ON_TRACK'}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-brand-blue">{p.progress}%</td>
                          <td className="p-3 font-mono text-gray-700">
                            {new Date(p.deadline).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="p-3 text-gray-700">{p.assignedTo || 'Unassigned'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Document Sign-off Footer */}
              <div className="pt-6 border-t-2 border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <p>Generated by SnapTech Digital Work Tracker &bull; Hindustan Projects Enterprise</p>
                <p className="font-mono">Page 1 of 1</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
