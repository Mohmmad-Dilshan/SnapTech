/**
 * clientProjects.controller.js — Admin CRUD for Client Projects
 */
import prisma from '../config/db.js'
import { logActivity } from '../utils/activity.js'
import sendMail from '../utils/mailer.js'

export const listClientProjects = async (req, res, next) => {
  try {
    const isStaff = req.admin?.role === 'STAFF'
    const whereClause = { deletedAt: null }

    if (req.query.clientId) {
      whereClause.clientId = req.query.clientId
    }

    if (isStaff) {
      whereClause.OR = [
        { assignedToEmail: req.admin.email },
        { assignedTo: req.admin.email },
      ]
    }

    const projects = await prisma.clientProject.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        tasks: true,
        dailyLogs: {
          orderBy: { date: 'desc' },
        },
        issues: {
          orderBy: { createdAt: 'desc' },
        },
        features: {
          orderBy: { createdAt: 'desc' },
        },
        billingMilestones: {
          orderBy: { createdAt: 'desc' },
        },
        attachments: {
          orderBy: { createdAt: 'desc' },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
    res.json({ status: 'ok', data: projects })
  } catch (err) {
    next(err)
  }
}

export const createClientProject = async (req, res, next) => {
  try {
    const {
      clientName,
      projectTitle,
      description,
      startDate,
      deadline,
      assignedTo,
      assignedToEmail,
      budget,
      tags,
      notes,
      status,
      priority,
      progress,
      clientId,
      projectType,
      liveUrl,
      stagingUrl,
      repoUrl,
      credentialsNotes,
      health,
      devStage,
      scopeFeatures,
      changeRequests,
      initialRequirement,
      extraTimeRequired,
      timeRemainingEstimate,
      paymentStatus,
      paymentReceived,
      paymentPending,
      paymentNotes,
      clientContact,
      currentStatusNote,
    } = req.body
    if (!clientName || !projectTitle || !startDate || !deadline) {
      return res.status(400).json({
        status: 'error',
        message: 'Client name, project title, start date, and deadline are required.',
      })
    }
    let finalClientId = clientId || null
    if (!finalClientId && clientName) {
      const existingClient = await prisma.client.findFirst({
        where: {
          OR: [
            { name: { equals: clientName, mode: 'insensitive' } },
            { email: { equals: clientName.trim(), mode: 'insensitive' } },
          ],
        },
      })
      if (existingClient) {
        finalClientId = existingClient.id
      }
    }

    const project = await prisma.clientProject.create({
      data: {
        clientName,
        projectTitle,
        description,
        startDate: new Date(startDate),
        deadline: new Date(deadline),
        assignedTo,
        assignedToEmail: assignedToEmail || null,
        budget,
        tags: tags ?? [],
        notes,
        status: status ?? 'PLANNING',
        priority: priority ?? 'MEDIUM',
        progress: progress ? parseInt(progress) : 0,
        clientId: finalClientId,
        projectType: projectType || 'Website Development',
        liveUrl: liveUrl || null,
        stagingUrl: stagingUrl || null,
        repoUrl: repoUrl || null,
        credentialsNotes: credentialsNotes || null,
        health: health || 'ON_TRACK',
        devStage: devStage || 'PLANNING',
        scopeFeatures: scopeFeatures || null,
        changeRequests: changeRequests || null,
        initialRequirement: initialRequirement || null,
        extraTimeRequired: extraTimeRequired || null,
        timeRemainingEstimate: timeRemainingEstimate || null,
        paymentStatus: paymentStatus || 'PENDING',
        paymentReceived: paymentReceived || null,
        paymentPending: paymentPending || null,
        paymentNotes: paymentNotes || null,
        clientContact: clientContact || null,
        currentStatusNote: currentStatusNote || null,
      },
      include: {
        tasks: true,
        attachments: true,
        dailyLogs: true,
        issues: true,
        features: true,
        billingMilestones: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    await logActivity(
      req,
      'CREATE',
      'ClientProject',
      `Created project '${project.projectTitle}' for client '${project.clientName}'`
    )

    // 1) Notify client via email if linked
    if (project.client && project.client.email) {
      sendMail({
        to: project.client.email,
        subject: `🚀 New Project Initialized: ${project.projectTitle}`,
        event: 'project.kickoff',
        templateId: 'project_kickoff_update',
        idempotencyKey: `proj-kickoff-${project.id}`,
        replyTo: 'projects@snaptech.digital',
        isCustomerCopy: true,
        metadata: { projectId: project.id, clientName: project.clientName },
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
            <h2 style="color: #1e3a8a; margin-top: 0;">Project Setup: ${project.projectTitle}</h2>
            <p>Dear <strong>${project.client.name}</strong>,</p>
            <p>Your new project portal workspace has been successfully created by SnapTech Digital:</p>
            <div style="background-color: #f8fafc; padding: 16px; border-radius: 12px; margin: 16px 0; border: 1px solid #cbd5e1;">
              <p style="margin: 6px 0;"><strong>Status:</strong> ${project.status}</p>
              <p style="margin: 6px 0;"><strong>Start Date:</strong> ${new Date(project.startDate).toLocaleDateString('en-IN')}</p>
              <p style="margin: 6px 0;"><strong>Estimated Deadline:</strong> ${new Date(project.deadline).toLocaleDateString('en-IN')}</p>
              <p style="margin: 6px 0;"><strong>Assigned Lead:</strong> ${project.assignedTo || 'Senior Tech Lead'}</p>
            </div>
            <p>Log into your Client Portal to track real-time progress, review milestone invoices, and access your project File Vault:</p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${process.env.CLIENT_URL || 'https://www.snaptech.digital'}/client/projects/${project.id}" style="background-color: #0066FF; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block;">View Project in Client Portal</a>
            </div>
            <p style="font-size: 11px; color: #64748b; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px;">SnapTech Digital &bull; A Hindustan Projects Enterprise — Bhilwara, Rajasthan</p>
          </div>
        `,
      }).catch((err) => console.error('[ClientProject/mailer] Client email failed:', err.message))
    }

    // 2) Notify assigned staff member via email
    if (assignedToEmail) {
      sendMail({
        to: assignedToEmail,
        subject: `📋 New Project Assigned to You: ${project.projectTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
            <h2 style="color: #1e3a8a; margin-top: 0;">You have been assigned a new project!</h2>
            <p>Hi <strong>${assignedTo}</strong>,</p>
            <p>You have been assigned as the lead on a new client project at SnapTech Digital:</p>
            <div style="background-color: #f0f9ff; padding: 16px; border-radius: 12px; margin: 16px 0; border: 1px solid #bae6fd;">
              <p style="margin: 6px 0;"><strong>Project:</strong> ${project.projectTitle}</p>
              <p style="margin: 6px 0;"><strong>Client:</strong> ${project.clientName}</p>
              <p style="margin: 6px 0;"><strong>Status:</strong> ${project.status}</p>
              <p style="margin: 6px 0;"><strong>Start Date:</strong> ${new Date(project.startDate).toLocaleDateString('en-IN')}</p>
              <p style="margin: 6px 0;"><strong>Deadline:</strong> ${new Date(project.deadline).toLocaleDateString('en-IN')}</p>
              <p style="margin: 6px 0;"><strong>Priority:</strong> ${project.priority}</p>
            </div>
            <p>Please log into the admin panel to review the project details and start work:</p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${process.env.CLIENT_URL || 'https://www.snaptech.digital'}/admin/client-projects" style="background-color: #1A3E8C; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block;">Open Admin Panel</a>
            </div>
            <p style="font-size: 11px; color: #64748b; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px;">SnapTech Digital &bull; Internal Assignment Notification</p>
          </div>
        `,
      }).catch((err) => console.error('[ClientProject/mailer] Staff email failed:', err.message))
    }

    res.status(201).json({ status: 'ok', data: project })
  } catch (err) {
    next(err)
  }
}

export const updateClientProject = async (req, res, next) => {
  try {
    const { id } = req.params
    const updateData = { ...req.body }

    // Sanitize updateData to delete relational objects & metadata that break Prisma scalar update
    delete updateData.id
    delete updateData.tasks
    delete updateData.attachments
    delete updateData.billingMilestones
    delete updateData.tickets
    delete updateData.dailyLogs
    delete updateData.issues
    delete updateData.features
    delete updateData.client
    delete updateData.hasFeedback
    delete updateData.createdAt
    delete updateData.updatedAt
    delete updateData.deletedAt

    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate)
    if (updateData.deadline) updateData.deadline = new Date(updateData.deadline)
    if (updateData.progress !== undefined) updateData.progress = parseInt(updateData.progress)
    if (updateData.clientId === '') {
      updateData.clientId = null
    }

    if (!updateData.clientId && updateData.clientName) {
      const existingClient = await prisma.client.findFirst({
        where: {
          OR: [
            { name: { equals: updateData.clientName, mode: 'insensitive' } },
            { email: { equals: updateData.clientName.trim(), mode: 'insensitive' } },
          ],
        },
      })
      if (existingClient) {
        updateData.clientId = existingClient.id
      }
    }

    const project = await prisma.clientProject.update({
      where: { id },
      data: updateData,
      include: {
        tasks: true,
        dailyLogs: {
          orderBy: { date: 'desc' },
        },
        issues: {
          orderBy: { createdAt: 'desc' },
        },
        features: {
          orderBy: { createdAt: 'desc' },
        },
        billingMilestones: {
          orderBy: { createdAt: 'desc' },
        },
        attachments: {
          orderBy: { createdAt: 'desc' },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    await logActivity(
      req,
      'UPDATE',
      'ClientProject',
      `Updated project '${project.projectTitle}' (Progress: ${project.progress}%, Status: ${project.status})`
    )

    // 1) Notify client via email if linked
    if (project.client && project.client.email) {
      sendMail({
        to: project.client.email,
        subject: `🚀 Project Progress Update: ${project.projectTitle} (${project.progress}% Complete)`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
            <h2 style="color: #1e3a8a; margin-top: 0;">Project Update: ${project.projectTitle}</h2>
            <p>Dear <strong>${project.client.name}</strong>,</p>
            <p>Your project progress and milestone status have been updated on the SnapTech Digital portal:</p>
            <div style="background-color: #f8fafc; padding: 16px; border-radius: 12px; margin: 16px 0; border: 1px solid #cbd5e1;">
              <p style="margin: 6px 0;"><strong>Status:</strong> ${project.status}</p>
              <p style="margin: 6px 0;"><strong>Completion Progress:</strong> ${project.progress}%</p>
              <p style="margin: 6px 0;"><strong>Project Lead:</strong> ${project.assignedTo || 'Assigned Lead'}</p>
              <p style="margin: 6px 0;"><strong>Target Deadline:</strong> ${new Date(project.deadline).toLocaleDateString('en-IN')}</p>
            </div>
            <p>Check the latest deliverables, upload asset files, or review GST invoices inside your Client Portal:</p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${process.env.CLIENT_URL || 'https://www.snaptech.digital'}/client/projects/${project.id}" style="background-color: #0066FF; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block;">Open Client Portal Project</a>
            </div>
            <p style="font-size: 11px; color: #64748b; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px;">SnapTech Digital &bull; A Hindustan Projects Enterprise — Bhilwara, Rajasthan</p>
          </div>
        `,
      }).catch((err) => console.error('[ClientProject/mailer] Client email failed:', err.message))
    }

    // 2) Notify assigned staff if assignment changed
    if (project.assignedToEmail) {
      sendMail({
        to: project.assignedToEmail,
        subject: `📋 Project Assignment Update: ${project.projectTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
            <h2 style="color: #1e3a8a; margin-top: 0;">Project Update — You Are the Assigned Lead</h2>
            <p>Hi <strong>${project.assignedTo}</strong>,</p>
            <p>The following project has been updated and you are assigned as the lead:</p>
            <div style="background-color: #f0f9ff; padding: 16px; border-radius: 12px; margin: 16px 0; border: 1px solid #bae6fd;">
              <p style="margin: 6px 0;"><strong>Project:</strong> ${project.projectTitle}</p>
              <p style="margin: 6px 0;"><strong>Client:</strong> ${project.clientName}</p>
              <p style="margin: 6px 0;"><strong>Status:</strong> ${project.status}</p>
              <p style="margin: 6px 0;"><strong>Progress:</strong> ${project.progress}%</p>
              <p style="margin: 6px 0;"><strong>Deadline:</strong> ${new Date(project.deadline).toLocaleDateString('en-IN')}</p>
              <p style="margin: 6px 0;"><strong>Priority:</strong> ${project.priority}</p>
            </div>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${process.env.CLIENT_URL || 'https://www.snaptech.digital'}/admin/client-projects" style="background-color: #1A3E8C; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block;">Open Admin Panel</a>
            </div>
            <p style="font-size: 11px; color: #64748b; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px;">SnapTech Digital &bull; Internal Assignment Notification</p>
          </div>
        `,
      }).catch((err) => console.error('[ClientProject/mailer] Staff email failed:', err.message))
    }

    res.json({ status: 'ok', data: project })
  } catch (err) {
    next(err)
  }
}

export const deleteClientProject = async (req, res, next) => {
  try {
    const { id } = req.params
    const project = await prisma.clientProject.findUnique({ where: { id } })
    if (project) {
      await prisma.clientProject.update({
        where: { id },
        data: { deletedAt: new Date() },
      })
      await logActivity(
        req,
        'DELETE',
        'ClientProject',
        `Soft deleted project '${project.projectTitle}' (Client: ${project.clientName})`
      )
    }
    res.json({ status: 'ok', message: 'Client project soft deleted.' })
  } catch (err) {
    next(err)
  }
}

// ── Daily Work Logs CRUD ──────────────────────────────────────────

export const listDailyLogs = async (req, res, next) => {
  try {
    const { id } = req.params
    const logs = await prisma.dailyWorkLog.findMany({
      where: { clientProjectId: id },
      orderBy: { date: 'desc' },
    })
    res.json({ status: 'ok', data: logs })
  } catch (err) {
    next(err)
  }
}

export const createDailyLog = async (req, res, next) => {
  try {
    const { id } = req.params
    const {
      workDone,
      featuresAdded,
      bugsFixed,
      issuesEncountered,
      pendingWork,
      nextDayPlan,
      timeSpentHours,
      notes,
      date,
    } = req.body

    if (!workDone || !workDone.trim()) {
      return res.status(400).json({ status: 'error', message: 'Work done summary is required.' })
    }

    const authorName = req.admin?.name || req.admin?.email?.split('@')[0] || 'Team Lead'
    const authorEmail = req.admin?.email || null

    const log = await prisma.dailyWorkLog.create({
      data: {
        clientProjectId: id,
        date: date ? new Date(date) : new Date(),
        authorName,
        authorEmail,
        workDone: workDone.trim(),
        featuresAdded: featuresAdded ? featuresAdded.trim() : null,
        bugsFixed: bugsFixed ? bugsFixed.trim() : null,
        issuesEncountered: issuesEncountered ? issuesEncountered.trim() : null,
        pendingWork: pendingWork ? pendingWork.trim() : null,
        nextDayPlan: nextDayPlan ? nextDayPlan.trim() : null,
        timeSpentHours: timeSpentHours ? parseFloat(timeSpentHours) : 0,
        notes: notes ? notes.trim() : null,
      },
    })

    await logActivity(req, 'CREATE', 'DailyWorkLog', `Logged daily update for project ID: ${id}`)
    res.status(201).json({ status: 'ok', data: log })
  } catch (err) {
    next(err)
  }
}

export const deleteDailyLog = async (req, res, next) => {
  try {
    const { logId } = req.params
    await prisma.dailyWorkLog.delete({ where: { id: logId } })
    await logActivity(req, 'DELETE', 'DailyWorkLog', `Deleted daily work log ID: ${logId}`)
    res.json({ status: 'ok', message: 'Daily work log removed.' })
  } catch (err) {
    next(err)
  }
}

// ── Project Issues & Bugs CRUD ────────────────────────────────────

export const listProjectIssues = async (req, res, next) => {
  try {
    const { id } = req.params
    const issues = await prisma.projectIssue.findMany({
      where: { clientProjectId: id },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ status: 'ok', data: issues })
  } catch (err) {
    next(err)
  }
}

export const createProjectIssue = async (req, res, next) => {
  try {
    const { id } = req.params
    const { title, description, issueType, severity, status, assignedTo } = req.body

    if (!title || !title.trim()) {
      return res.status(400).json({ status: 'error', message: 'Issue title is required.' })
    }

    const issue = await prisma.projectIssue.create({
      data: {
        clientProjectId: id,
        title: title.trim(),
        description: description ? description.trim() : null,
        issueType: issueType || 'BUG',
        severity: severity || 'MEDIUM',
        status: status || 'OPEN',
        assignedTo: assignedTo || null,
      },
    })

    await logActivity(req, 'CREATE', 'ProjectIssue', `Reported issue '${issue.title}'`)
    res.status(201).json({ status: 'ok', data: issue })
  } catch (err) {
    next(err)
  }
}

export const updateProjectIssue = async (req, res, next) => {
  try {
    const { issueId } = req.params
    const updateData = { ...req.body }

    if (updateData.status === 'RESOLVED') {
      updateData.resolvedAt = new Date()
    } else if (updateData.status && updateData.status !== 'RESOLVED') {
      updateData.resolvedAt = null
    }

    const issue = await prisma.projectIssue.update({
      where: { id: issueId },
      data: updateData,
    })

    await logActivity(req, 'UPDATE', 'ProjectIssue', `Updated issue '${issue.title}' (Status: ${issue.status})`)
    res.json({ status: 'ok', data: issue })
  } catch (err) {
    next(err)
  }
}

export const deleteProjectIssue = async (req, res, next) => {
  try {
    const { issueId } = req.params
    await prisma.projectIssue.delete({ where: { id: issueId } })
    await logActivity(req, 'DELETE', 'ProjectIssue', `Deleted issue ID: ${issueId}`)
    res.json({ status: 'ok', message: 'Project issue removed.' })
  } catch (err) {
    next(err)
  }
}

// ── Project Features Pipeline CRUD ────────────────────────────────

export const listProjectFeatures = async (req, res, next) => {
  try {
    const { id } = req.params
    const features = await prisma.projectFeature.findMany({
      where: { clientProjectId: id },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ status: 'ok', data: features })
  } catch (err) {
    next(err)
  }
}

export const createProjectFeature = async (req, res, next) => {
  try {
    const { id } = req.params
    const { name, description, status, requestedBy, assignedTo } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({ status: 'error', message: 'Feature name is required.' })
    }

    const feature = await prisma.projectFeature.create({
      data: {
        clientProjectId: id,
        name: name.trim(),
        description: description ? description.trim() : null,
        status: status || 'PLANNED',
        requestedBy: requestedBy || null,
        assignedTo: assignedTo || null,
      },
    })

    await logActivity(req, 'CREATE', 'ProjectFeature', `Added feature '${feature.name}'`)
    res.status(201).json({ status: 'ok', data: feature })
  } catch (err) {
    next(err)
  }
}

export const updateProjectFeature = async (req, res, next) => {
  try {
    const { featureId } = req.params
    const updateData = { ...req.body }

    if (updateData.status === 'RELEASED') {
      updateData.releasedAt = new Date()
    } else if (updateData.status && updateData.status !== 'RELEASED') {
      updateData.releasedAt = null
    }

    const feature = await prisma.projectFeature.update({
      where: { id: featureId },
      data: updateData,
    })

    await logActivity(req, 'UPDATE', 'ProjectFeature', `Updated feature '${feature.name}' (Status: ${feature.status})`)
    res.json({ status: 'ok', data: feature })
  } catch (err) {
    next(err)
  }
}

export const deleteProjectFeature = async (req, res, next) => {
  try {
    const { featureId } = req.params
    await prisma.projectFeature.delete({ where: { id: featureId } })
    await logActivity(req, 'DELETE', 'ProjectFeature', `Deleted feature ID: ${featureId}`)
    res.json({ status: 'ok', message: 'Project feature removed.' })
  } catch (err) {
    next(err)
  }
}

// ── Boss / Management Reporting Aggregator ─────────────────────────

export const getManagementReport = async (req, res, next) => {
  try {
    const { reportType = 'DAILY', startDate, endDate, clientProjectId, clientId } = req.query

    const now = new Date()
    let start = new Date()
    let end = new Date()

    if (reportType === 'DAILY') {
      start = startDate ? new Date(startDate) : new Date(now.setHours(0, 0, 0, 0))
      end = new Date(start)
      end.setHours(23, 59, 59, 999)
    } else if (reportType === 'WEEKLY') {
      start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      start.setHours(0, 0, 0, 0)
      end = new Date()
    } else if (reportType === 'CUSTOM') {
      start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      end = endDate ? new Date(endDate) : new Date()
      end.setHours(23, 59, 59, 999)
    } else {
      start = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
      end = new Date()
    }

    const whereProjects = { deletedAt: null }
    if (clientProjectId) whereProjects.id = clientProjectId
    if (clientId) whereProjects.clientId = clientId

    const projects = await prisma.clientProject.findMany({
      where: whereProjects,
      include: {
        tasks: true,
        issues: true,
        features: true,
        dailyLogs: {
          where: {
            date: {
              gte: start,
              lte: end,
            },
          },
          orderBy: { date: 'desc' },
        },
        billingMilestones: true,
        client: true,
      },
    })

    let allLogs = []
    let allIssues = []
    let allFeatures = []
    let allTasks = []
    let totalHoursLogged = 0

    projects.forEach((p) => {
      if (p.dailyLogs) {
        allLogs.push(
          ...p.dailyLogs.map((l) => ({
            ...l,
            projectTitle: p.projectTitle,
            clientName: p.clientName,
          }))
        )
      }
      if (p.issues) {
        allIssues.push(
          ...p.issues.map((i) => ({
            ...i,
            projectTitle: p.projectTitle,
            clientName: p.clientName,
          }))
        )
      }
      if (p.features) {
        allFeatures.push(
          ...p.features.map((f) => ({
            ...f,
            projectTitle: p.projectTitle,
            clientName: p.clientName,
          }))
        )
      }
      if (p.tasks) {
        allTasks.push(
          ...p.tasks.map((t) => ({
            ...t,
            projectTitle: p.projectTitle,
            clientName: p.clientName,
          }))
        )
      }
    })

    allLogs.sort((a, b) => new Date(b.date) - new Date(a.date))
    totalHoursLogged = allLogs.reduce((sum, l) => sum + (Number(l.timeSpentHours) || 0), 0)

    const openIssues = allIssues.filter((i) => i.status !== 'RESOLVED')
    const resolvedIssues = allIssues.filter((i) => i.status === 'RESOLVED')
    const completedTasks = allTasks.filter((t) => t.status === 'DONE')
    const pendingTasks = allTasks.filter((t) => t.status !== 'DONE')

    const report = {
      reportType,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      metrics: {
        totalProjects: projects.length,
        activeProjects: projects.filter((p) => p.status === 'IN_PROGRESS' || p.status === 'REVIEW').length,
        completedProjects: projects.filter((p) => p.status === 'COMPLETED').length,
        totalHoursLogged: Math.round(totalHoursLogged * 10) / 10,
        totalLogsCount: allLogs.length,
        totalIssues: allIssues.length,
        openIssuesCount: openIssues.length,
        resolvedIssuesCount: resolvedIssues.length,
        pendingTasksCount: pendingTasks.length,
        completedTasksCount: completedTasks.length,
      },
      projects: projects.map((p) => ({
        id: p.id,
        projectTitle: p.projectTitle,
        clientName: p.clientName,
        projectType: p.projectType,
        status: p.status,
        health: p.health,
        progress: p.progress,
        deadline: p.deadline,
        budget: p.budget,
        liveUrl: p.liveUrl,
        stagingUrl: p.stagingUrl,
        repoUrl: p.repoUrl,
        assignedTo: p.assignedTo,
        openIssuesCount: (p.issues || []).filter((i) => i.status !== 'RESOLVED').length,
        logsInPeriod: (p.dailyLogs || []).length,
      })),
      dailyLogs: allLogs,
      openIssues,
      resolvedIssues,
      features: allFeatures,
    }

    res.json({ status: 'ok', data: report })
  } catch (err) {
    next(err)
  }
}
