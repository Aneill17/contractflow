'use client'

import { useEffect, useState, useCallback } from 'react'
import { getAuthHeaders } from '@/lib/auth'

interface Staff {
  id: string
  name: string
  role: 'ground_team' | 'manager' | 'admin'
  email?: string
  phone?: string
  status: 'active' | 'inactive'
  notes?: string
  created_at: string
}

interface Task {
  id: string
  title: string
  description?: string
  assigned_to?: string
  staff?: { name: string }
  priority: 'urgent' | 'high' | 'normal' | 'low'
  status: 'open' | 'in_progress' | 'done' | 'cancelled'
  due_date?: string
  completed_at?: string
  notes?: string
  created_at: string
  updated_at: string
}

const ROLE_COLORS: Record<string, string> = {
  ground_team: '#4C7BC9',
  manager: '#C9A84C',
  admin: '#9B59B6',
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#E84855',
  high: '#C9A84C',
  normal: '#4C7BC9',
  low: '#888888',
}

function AddStaffModal({ onClose, onSave }: { onClose: () => void; onSave: (s: Staff) => void }) {
  const [form, setForm] = useState({ name: '', role: 'ground_team', email: '', phone: '', status: 'active', notes: '' })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const headers = await getAuthHeaders()
      const r = await fetch('/api/staff', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (r.ok) { const data = await r.json(); onSave(data); onClose() }
    } finally { setSaving(false) }
  }

  const inputStyle: React.CSSProperties = {
    background: '#0C0E14', border: '1px solid #ffffff12', borderRadius: 6,
    padding: '9px 12px', color: '#DDD5C8', fontSize: 12,
    fontFamily: 'IBM Plex Mono, monospace', width: '100%', outline: 'none',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 9, color: '#ffffff33', letterSpacing: '0.12em', marginBottom: 4,
    display: 'block', fontFamily: 'IBM Plex Mono, monospace',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#00000088', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#13161D', border: '1px solid #ffffff10', borderRadius: 12, width: '100%', maxWidth: 480, maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #ffffff0D', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 14, color: '#DDD5C8', fontFamily: 'IBM Plex Mono, monospace' }}>Add Staff Member</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#ffffff44', cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>NAME *</label>
            <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Full name" />
          </div>
          <div>
            <label style={labelStyle}>ROLE</label>
            <select style={inputStyle} value={form.role} onChange={e => set('role', e.target.value)}>
              <option value="ground_team">Ground Team</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>EMAIL</label>
              <input style={inputStyle} value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" />
            </div>
            <div>
              <label style={labelStyle}>PHONE</label>
              <input style={inputStyle} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(250) 555-0100" />
            </div>
          </div>
          <div>
            <label style={labelStyle}>STATUS</label>
            <select style={inputStyle} value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>NOTES</label>
            <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any notes..." />
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            style={{
              background: saving || !form.name.trim() ? '#ffffff11' : '#C9A84C',
              color: saving || !form.name.trim() ? '#ffffff33' : '#0C0E14',
              border: 'none', borderRadius: 6, padding: '10px 20px', fontSize: 12,
              fontFamily: 'IBM Plex Mono, monospace', cursor: saving || !form.name.trim() ? 'not-allowed' : 'pointer',
              fontWeight: 700, marginTop: 4,
            }}
          >
            {saving ? 'Saving...' : 'Save Staff Member'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AddTaskModal({ staffList, onClose, onSave }: { staffList: Staff[]; onClose: () => void; onSave: (t: Task) => void }) {
  const [form, setForm] = useState({ title: '', description: '', assigned_to: '', priority: 'normal', due_date: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const headers = await getAuthHeaders()
      const r = await fetch('/api/tasks', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, assigned_to: form.assigned_to || null }),
      })
      if (r.ok) { const data = await r.json(); onSave(data); onClose() }
    } finally { setSaving(false) }
  }

  const inputStyle: React.CSSProperties = {
    background: '#0C0E14', border: '1px solid #ffffff12', borderRadius: 6,
    padding: '9px 12px', color: '#DDD5C8', fontSize: 12,
    fontFamily: 'IBM Plex Mono, monospace', width: '100%', outline: 'none',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 9, color: '#ffffff33', letterSpacing: '0.12em', marginBottom: 4,
    display: 'block', fontFamily: 'IBM Plex Mono, monospace',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#00000088', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#13161D', border: '1px solid #ffffff10', borderRadius: 12, width: '100%', maxWidth: 480, maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #ffffff0D', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 14, color: '#DDD5C8', fontFamily: 'IBM Plex Mono, monospace' }}>New Task</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#ffffff44', cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>TITLE *</label>
            <input style={inputStyle} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Task title" />
          </div>
          <div>
            <label style={labelStyle}>DESCRIPTION</label>
            <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Optional details..." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>ASSIGN TO</label>
              <select style={inputStyle} value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)}>
                <option value="">— Unassigned —</option>
                {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>PRIORITY</label>
              <select style={inputStyle} value={form.priority} onChange={e => set('priority', e.target.value)}>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>DUE DATE</label>
            <input style={inputStyle} type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>NOTES</label>
            <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any notes..." />
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !form.title.trim()}
            style={{
              background: saving || !form.title.trim() ? '#ffffff11' : '#C9A84C',
              color: saving || !form.title.trim() ? '#ffffff33' : '#0C0E14',
              border: 'none', borderRadius: 6, padding: '10px 20px', fontSize: 12,
              fontFamily: 'IBM Plex Mono, monospace', cursor: saving || !form.title.trim() ? 'not-allowed' : 'pointer',
              fontWeight: 700, marginTop: 4,
            }}
          >
            {saving ? 'Saving...' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TeamPage() {
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [showAddStaff, setShowAddStaff] = useState(false)
  const [showAddTask, setShowAddTask] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const headers = await getAuthHeaders()
      const [sr, tr] = await Promise.all([
        fetch('/api/staff', { headers }),
        fetch('/api/tasks', { headers }),
      ])
      if (sr.ok) setStaffList(await sr.json())
      if (tr.ok) setTasks(await tr.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const filteredTasks = selectedStaff
    ? tasks.filter(t => t.assigned_to === selectedStaff.id)
    : tasks

  const openTasks = filteredTasks.filter(t => t.status === 'open')
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in_progress')
  const doneTasks = filteredTasks.filter(t => t.status === 'done')

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const doneThisWeek = doneTasks.filter(t => t.completed_at && new Date(t.completed_at) > weekAgo).length
  const overdue = filteredTasks.filter(t =>
    t.status !== 'done' && t.status !== 'cancelled' && t.due_date && new Date(t.due_date) < now
  ).length

  const advanceTask = async (task: Task) => {
    const nextStatus: Record<string, string> = { open: 'in_progress', in_progress: 'done' }
    const next = nextStatus[task.status]
    if (!next) return
    const headers = await getAuthHeaders()
    const r = await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    if (r.ok) {
      const updated = await r.json()
      setTasks(ts => ts.map(t => t.id === updated.id ? updated : t))
    }
  }

  const isOverdue = (task: Task) =>
    task.status !== 'done' && task.status !== 'cancelled' && task.due_date && new Date(task.due_date) < now

  const cardStyle: React.CSSProperties = {
    background: '#13161D',
    border: '1px solid #ffffff0D',
    borderRadius: 8,
    padding: '12px 14px',
    marginBottom: 8,
    cursor: 'default',
  }

  const TaskCard = ({ task }: { task: Task }) => (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div style={{
          fontSize: 12, fontWeight: 600, color: '#DDD5C8', lineHeight: 1.3,
          textDecoration: task.status === 'done' ? 'line-through' : 'none',
          opacity: task.status === 'done' ? 0.5 : 1,
          flex: 1, marginRight: 8,
        }}>
          {task.title}
        </div>
        <span style={{
          fontSize: 9, fontWeight: 600, letterSpacing: '0.06em',
          color: PRIORITY_COLORS[task.priority] || '#888888',
          background: (PRIORITY_COLORS[task.priority] || '#888888') + '22',
          borderRadius: 4, padding: '2px 7px', whiteSpace: 'nowrap',
        }}>
          {task.priority.toUpperCase()}
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {task.due_date && (
            <span style={{ fontSize: 9, color: isOverdue(task) ? '#E84855' : '#ffffff33' }}>
              {isOverdue(task) ? '⚠ ' : ''}
              {new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {task.staff?.name && (
            <span style={{ fontSize: 9, color: '#ffffff44' }}>{task.staff.name}</span>
          )}
        </div>
        {task.status !== 'done' && (
          <button
            onClick={() => advanceTask(task)}
            style={{
              background: '#ffffff08', border: 'none', borderRadius: 4,
              color: '#C9A84C', fontSize: 10, fontFamily: 'IBM Plex Mono, monospace',
              cursor: 'pointer', padding: '3px 8px',
            }}
          >
            → Next
          </button>
        )}
      </div>
    </div>
  )

  const columnStyle: React.CSSProperties = {
    flex: 1,
    background: '#0a0c12',
    border: '1px solid #ffffff08',
    borderRadius: 10,
    padding: 14,
    minHeight: 200,
  }

  const colHeaderStyle: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
    marginBottom: 12, color: '#ffffff66',
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0C0E14', color: '#DDD5C8', fontFamily: 'IBM Plex Mono, monospace', overflow: 'hidden' }}>
      {showAddStaff && (
        <AddStaffModal
          onClose={() => setShowAddStaff(false)}
          onSave={s => { setStaffList(sl => [...sl, s]); setShowAddStaff(false) }}
        />
      )}
      {showAddTask && (
        <AddTaskModal
          staffList={staffList}
          onClose={() => setShowAddTask(false)}
          onSave={t => { setTasks(ts => [...ts, t]); setShowAddTask(false) }}
        />
      )}

      {/* Left panel */}
      <div style={{ width: 280, borderRight: '1px solid #ffffff08', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid #ffffff08', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <button onClick={() => window.location.href = '/'} style={{ background: 'none', border: 'none', color: '#ffffff33', cursor: 'pointer', fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', padding: 0, marginBottom: 6, display: 'block' }}>← Dashboard</button>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Ground Team</div>
          </div>
          <button
            onClick={() => setShowAddStaff(true)}
            style={{
              background: '#C9A84C', border: 'none', borderRadius: 6, padding: '6px 12px',
              color: '#0C0E14', fontSize: 10, fontFamily: 'IBM Plex Mono, monospace',
              cursor: 'pointer', fontWeight: 700,
            }}
          >
            + Add
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '8px 10px' }}>
          {/* All Tasks option */}
          <div
            onClick={() => setSelectedStaff(null)}
            style={{
              padding: '8px 12px', borderRadius: 7, marginBottom: 4, cursor: 'pointer',
              background: !selectedStaff ? '#C9A84C22' : 'transparent',
              border: !selectedStaff ? '1px solid #C9A84C44' : '1px solid transparent',
              fontSize: 11, color: !selectedStaff ? '#C9A84C' : '#ffffff66',
              fontWeight: !selectedStaff ? 700 : 400,
            }}
          >
            📋 All Tasks
          </div>

          {loading ? (
            <div style={{ fontSize: 10, color: '#ffffff22', padding: '12px 6px' }}>Loading...</div>
          ) : staffList.length === 0 ? (
            <div style={{ fontSize: 10, color: '#ffffff22', padding: '12px 6px' }}>No staff yet. Add a team member.</div>
          ) : staffList.map(s => (
            <div
              key={s.id}
              onClick={() => setSelectedStaff(selectedStaff?.id === s.id ? null : s)}
              style={{
                background: selectedStaff?.id === s.id ? '#13161D' : 'transparent',
                border: selectedStaff?.id === s.id ? '1px solid #ffffff12' : '1px solid transparent',
                borderRadius: 8, padding: '10px 12px', marginBottom: 4, cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#DDD5C8' }}>{s.name}</span>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: s.status === 'active' ? '#4CAF93' : '#555',
                  display: 'inline-block',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  fontSize: 9, fontWeight: 600, letterSpacing: '0.06em',
                  color: ROLE_COLORS[s.role] || '#888',
                  background: (ROLE_COLORS[s.role] || '#888') + '22',
                  borderRadius: 4, padding: '2px 7px',
                }}>
                  {s.role.replace('_', ' ').toUpperCase()}
                </span>
                {s.phone && <span style={{ fontSize: 9, color: '#ffffff33' }}>{s.phone}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid #ffffff08', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>
              Tasks
              {selectedStaff && <span style={{ fontSize: 11, color: '#ffffff44', fontWeight: 400, marginLeft: 10 }}>— Showing: {selectedStaff.name}</span>}
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 10, color: '#ffffff44', marginTop: 4 }}>
              <span><span style={{ color: '#4C7BC9' }}>{openTasks.length}</span> open</span>
              <span><span style={{ color: '#C9A84C' }}>{inProgressTasks.length}</span> in progress</span>
              <span><span style={{ color: '#4CAF93' }}>{doneThisWeek}</span> done this week</span>
              {overdue > 0 && <span><span style={{ color: '#E84855' }}>{overdue}</span> overdue</span>}
            </div>
          </div>
          <button
            onClick={() => setShowAddTask(true)}
            style={{
              background: '#C9A84C', border: 'none', borderRadius: 6, padding: '8px 16px',
              color: '#0C0E14', fontSize: 11, fontFamily: 'IBM Plex Mono, monospace',
              cursor: 'pointer', fontWeight: 700,
            }}
          >
            + New Task
          </button>
        </div>

        {/* Kanban */}
        <div style={{ flex: 1, overflow: 'auto', padding: 20, display: 'flex', gap: 14 }}>
          <div style={columnStyle}>
            <div style={colHeaderStyle}>OPEN · {openTasks.length}</div>
            {openTasks.map(t => <TaskCard key={t.id} task={t} />)}
            {openTasks.length === 0 && <div style={{ fontSize: 10, color: '#ffffff22', textAlign: 'center', padding: '20px 0' }}>No open tasks</div>}
          </div>
          <div style={columnStyle}>
            <div style={{ ...colHeaderStyle, color: '#C9A84C99' }}>IN PROGRESS · {inProgressTasks.length}</div>
            {inProgressTasks.map(t => <TaskCard key={t.id} task={t} />)}
            {inProgressTasks.length === 0 && <div style={{ fontSize: 10, color: '#ffffff22', textAlign: 'center', padding: '20px 0' }}>Nothing in progress</div>}
          </div>
          <div style={columnStyle}>
            <div style={{ ...colHeaderStyle, color: '#4CAF9399' }}>DONE · {doneTasks.length}</div>
            {doneTasks.map(t => <TaskCard key={t.id} task={t} />)}
            {doneTasks.length === 0 && <div style={{ fontSize: 10, color: '#ffffff22', textAlign: 'center', padding: '20px 0' }}>No completed tasks</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
