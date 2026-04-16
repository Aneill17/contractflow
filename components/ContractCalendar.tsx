'use client'

import { useState, useEffect } from 'react'
import { Contract, ContractUnit } from '@/lib/types'
import { supabase } from '@/lib/supabase'

const N = '#0B2540', T = '#00BFA6', A = '#C4793A'
const MN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DN = ['Su','Mo','Tu','We','Th','Fr','Sa']

export default function ContractCalendar({ contract: c }: { contract: Contract }) {
  const [units, setUnits] = useState<ContractUnit[]>([])
  const start = new Date(c.start_date), end = new Date(c.end_date)
  const [ym, setYm] = useState({ y: start.getFullYear(), m: start.getMonth() })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const h: Record<string,string> = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
      fetch(`/api/contract-units?contract_id=${c.id}`, { headers: h })
        .then(r => r.ok ? r.json() : [])
        .then(setUnits)
    })
  }, [c.id])

  const nav = (d: -1|1) => setYm(p => { let m=p.m+d, y=p.y; if(m<0){m=11;y--} if(m>11){m=0;y++} return {y,m} })

  const { y, m } = ym
  const firstDay = new Date(y, m, 1).getDay()
  const daysInMonth = new Date(y, m+1, 0).getDate()

  const leaseRanges: Array<{s:Date; e:Date; label:string; color:string}> = []
  units.forEach(u => {
    ;(u.unit_leases||[]).forEach(l => {
      if (l.lease_start && l.lease_end) {
        leaseRanges.push({ s:new Date(l.lease_start), e:new Date(l.lease_end), label:`${u.address||'Unit'} (${l.type})`, color: l.type==='landlord'?'#6366f1':A })
      }
    })
  })

  const dayInfo = (day: number) => {
    const d = new Date(y, m, day)
    const isStart = d.toDateString() === start.toDateString()
    const isEnd   = d.toDateString() === end.toDateString()
    const inContract = d >= start && d <= end
    const leases = leaseRanges.filter(l => d >= l.s && d <= l.e)
    const isToday = d.toDateString() === new Date().toDateString()
    return { isStart, isEnd, inContract, leases, isToday }
  }

  const cells = [...Array(firstDay).fill(null), ...Array.from({length:daysInMonth}, (_,i)=>i+1)]

  return (
    <div>
      {/* Nav */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div style={{ fontWeight:700, color:N, fontSize:15 }}>{MN[m]} {y}</div>
        <div style={{ display:'flex', gap:6 }}>
          <button onClick={()=>nav(-1)} style={{ padding:'4px 10px', borderRadius:6, border:'1px solid #e8ecf0', background:'#fff', cursor:'pointer', color:N }}>‹</button>
          <button onClick={()=>setYm({y:start.getFullYear(),m:start.getMonth()})} style={{ padding:'4px 10px', borderRadius:6, border:'1px solid #e8ecf0', background:'#fff', cursor:'pointer', fontSize:11, fontFamily:'IBM Plex Mono', color:T }}>Contract Start</button>
          <button onClick={()=>nav(1)} style={{ padding:'4px 10px', borderRadius:6, border:'1px solid #e8ecf0', background:'#fff', cursor:'pointer', color:N }}>›</button>
        </div>
      </div>
      {/* Day headers */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:4 }}>
        {DN.map(d=><div key={d} style={{ textAlign:'center', fontSize:10, fontFamily:'IBM Plex Mono', color:'#94a3b8', padding:'4px 0' }}>{d}</div>)}
      </div>
      {/* Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const { isStart, isEnd, inContract, leases, isToday } = dayInfo(day)
          const isEdge = isStart || isEnd
          return (
            <div key={i} title={isStart?`Start: ${c.start_date}`:isEnd?`End: ${c.end_date}`:leases[0]?.label}
              style={{ aspectRatio:'1', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:isEdge?800:isToday?700:400, position:'relative', cursor:leases.length||isEdge?'help':'default',
                background: isEdge ? T : leases.length ? leases[0].color+'33' : inContract ? `${T}18` : '#f8f9fb',
                color: isEdge ? '#fff' : inContract ? '#0B6654' : '#374151',
                border: isToday ? `2px solid ${T}` : '1px solid transparent',
              }}>
              {day}
              {leases.length>0 && !isEdge && <div style={{ position:'absolute', bottom:2, right:2, width:4, height:4, borderRadius:'50%', background:leases[0].color }}/>}
            </div>
          )
        })}
      </div>
      {/* Legend */}
      <div style={{ display:'flex', gap:12, marginTop:12, flexWrap:'wrap' }}>
        {[{color:`${T}33`,label:'Contract period'},{color:T,label:'Start/End'},{color:`${A}33`,label:'Client lease'},{color:'#6366f133',label:'Landlord lease'}].map(l=>(
          <div key={l.label} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#64748b' }}>
            <div style={{ width:12, height:12, borderRadius:3, background:l.color }}/>{l.label}
          </div>
        ))}
      </div>
      {/* Summary */}
      <div style={{ marginTop:14, display:'flex', gap:10, flexWrap:'wrap' }}>
        {[{label:'Start',val:c.start_date,color:T},{label:'End',val:c.end_date,color:T}].map(({label,val,color})=>(
          <div key={label} style={{ padding:'8px 14px', background:`${color}10`, borderRadius:8, fontSize:12 }}>
            <span style={{ color, fontWeight:600 }}>{label}:</span> <span style={{ color:N }}>{val}</span>
          </div>
        ))}
        {units.length>0 && <div style={{ padding:'8px 14px', background:`${A}10`, borderRadius:8, fontSize:12 }}><span style={{ color:A, fontWeight:600 }}>Units:</span> <span style={{ color:N }}>{units.length} tracked</span></div>}
      </div>
    </div>
  )
}
