'use client'

import { useState } from 'react'
import { Contract } from '@/lib/types'

interface Props {
  contract: Contract
  onUpdate: (id: string, patch: Partial<Contract>, auditMsg?: string) => Promise<void>
  onRefresh: () => Promise<void>
  showToast: (msg: string, type?: string) => void
}

export default function ContractReview({ contract: c, onUpdate, onRefresh, showToast }: Props) {
  const generatedContract = (c as any).generated_contract
  const [contractText, setContractText] = useState(generatedContract || '')
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [reminding, setReminding] = useState(false)

  const isQuoteApproved = c.stage >= 2
  const isContractGenerated = !!generatedContract
  const isAwaitingApproval = c.stage === 1

  const generateContract = async () => {
    setGenerating(true)
    showToast('Generating contract with AI...')
    try {
      const res = await fetch(`/api/contracts/${c.id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contract_id: c.id }),
      })
      const data = await res.json()
      if (data.success) {
        setContractText(data.contract)
        showToast('Contract generated successfully')
        await onRefresh()
      } else {
        showToast('Generation failed — check logs', 'error')
      }
    } catch (e) {
      showToast('Generation failed', 'error')
    }
    setGenerating(false)
  }

  const saveEdits = async () => {
    setSaving(true)
    await onUpdate(c.id, { generated_contract: contractText } as any, 'Contract text edited manually')
    setEditing(false)
    showToast('Contract saved')
    setSaving(false)
  }

  const approveAndSend = async () => {
    setSending(true)
    try {
      // Save latest text
      await onUpdate(c.id, { generated_contract: contractText } as any, 'Contract approved for signing')

      // Trigger DocuSeal
      const res = await fetch('/api/docuseal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contract_id: c.id }),
      })
      const data = await res.json()
      if (data.success) {
        showToast('Contract sent to client for signature via DocuSeal')
        await onRefresh()
      } else {
        showToast('DocuSeal error — check logs', 'error')
        console.error(data)
      }
    } catch (e) {
      showToast('Error sending contract', 'error')
    }
    setSending(false)
  }

  const sendReminder = async () => {
    setReminding(true)
    const res = await fetch(`/api/contracts/${c.id}/remind`, { method: 'POST' })
    if (res.ok) {
      showToast(`Reminder sent to ${c.contact_email}`)
    } else {
      showToast('Failed to send reminder', 'error')
    }
    setReminding(false)
  }

  return (
    <div>
      <style>{`
        .cr-card { background: #13161D; border: 1px solid #ffffff0D; border-radius: 10px; padding: 22px; margin-bottom: 14px; }
        .cr-card-gold { background: #13161D; border: 1px solid #C9A84C2A; border-radius: 10px; padding: 22px; margin-bottom: 14px; }
        .cr-btn { border: none; border-radius: 7px; cursor: pointer; font-family: 'IBM Plex Mono', monospace; font-size: 12px; letter-spacing: 0.07em; padding: 10px 20px; transition: all 0.18s; }
        .cr-btn-gold { background: #C9A84C; color: #0C0E14; font-weight: 500; }
        .cr-btn-gold:hover { background: #DDB85C; }
        .cr-btn-gold:disabled { opacity: 0.5; cursor: not-allowed; }
        .cr-btn-ghost { background: transparent; color: #C9A84C; border: 1px solid #C9A84C44; }
        .cr-btn-ghost:hover { background: #C9A84C11; }
        .cr-btn-blue { background: #4C7BC922; color: #7BA7E2; border: 1px solid #4C7BC944; }
        .cr-btn-blue:hover { background: #4C7BC933; }
        .cr-btn-blue:disabled { opacity: 0.5; cursor: not-allowed; }
        .cr-section { font-family: 'Playfair Display', serif; font-size: 13px; font-style: italic; color: #C9A84C88; margin-bottom: 12px; }
        .cr-contract-text { background: #0C0E14; border: 1px solid #ffffff10; border-radius: 8px; padding: 28px 32px; font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #DDD5C8; line-height: 2; white-space: pre-wrap; max-height: 600px; overflow-y: auto; }
        .cr-contract-edit { background: #0C0E14; border: 1px solid #C9A84C44; border-radius: 8px; padding: 28px 32px; font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #DDD5C8; line-height: 2; width: 100%; min-height: 600px; outline: none; resize: vertical; }
      `}</style>

      {/* Status banner */}
      {isAwaitingApproval && (
        <div style={{ background: '#C9A84C15', border: '1px solid #C9A84C44', borderRadius: 8, padding: '14px 18px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#C9A84C', marginBottom: 2 }}>⏳ Awaiting Client Quote Approval</div>
            <div style={{ fontSize: 12, color: '#ffffff55' }}>Quote has been sent to {c.contact_email}. You can send a reminder while you wait.</div>
          </div>
          <button className="cr-btn cr-btn-ghost" onClick={sendReminder} disabled={reminding} style={{ whiteSpace: 'nowrap' }}>
            {reminding ? 'Sending...' : '✉ Send Reminder'}
          </button>
        </div>
      )}

      {/* Quote approved — generate contract */}
      {isQuoteApproved && !isContractGenerated && (
        <div className="cr-card-gold" style={{ textAlign: 'center', padding: '36px 28px' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, marginBottom: 8 }}>Quote Approved — Ready to Generate Contract</div>
          <div style={{ fontSize: 13, color: '#ffffff55', marginBottom: 24, lineHeight: 1.8 }}>
            The client has approved their quote. Click below to auto-generate the lease agreement<br/>
            using your template, pre-filled with all booking and quote details.
          </div>
          <button className="cr-btn cr-btn-gold" onClick={generateContract} disabled={generating}>
            {generating ? '⚙ Generating Contract...' : '✦ Generate Contract with AI →'}
          </button>
        </div>
      )}

      {/* Contract generated — internal review */}
      {isContractGenerated && (
        <>
          <div className="cr-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className="cr-section" style={{ margin: 0 }}>Internal Contract Review</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {!editing ? (
                  <button className="cr-btn cr-btn-ghost" style={{ fontSize: 11, padding: '7px 14px' }} onClick={() => setEditing(true)}>
                    ✎ Edit
                  </button>
                ) : (
                  <>
                    <button className="cr-btn cr-btn-ghost" style={{ fontSize: 11, padding: '7px 14px' }} onClick={() => { setEditing(false); setContractText(generatedContract) }}>
                      Cancel
                    </button>
                    <button className="cr-btn cr-btn-gold" style={{ fontSize: 11, padding: '7px 14px' }} onClick={saveEdits} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div style={{ fontSize: 12, color: '#ffffff33', fontFamily: 'IBM Plex Mono', marginBottom: 14 }}>
              Review the contract carefully before sending to the client for signature. You can edit any section above.
            </div>

            {!editing ? (
              <div className="cr-contract-text">{contractText}</div>
            ) : (
              <textarea
                className="cr-contract-edit"
                value={contractText}
                onChange={e => setContractText(e.target.value)}
              />
            )}
          </div>

          {/* Approve and send to DocuSeal */}
          {!(c as any).docuseal_submission_id && (
            <div className="cr-card" style={{ padding: '20px 22px' }}>
              <div className="cr-section">Approve & Send for Signature</div>
              <div style={{ fontSize: 13, color: '#ffffff55', marginBottom: 16, lineHeight: 1.8 }}>
                Once you're satisfied with the contract, approve it to send to the client for signature via DocuSeal.
                The client signs first, then you'll receive a notification to countersign.
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="cr-btn cr-btn-gold" onClick={approveAndSend} disabled={sending || editing}>
                  {sending ? 'Sending to DocuSeal...' : '✓ Approve & Send for Signature →'}
                </button>
                <button className="cr-btn cr-btn-blue" onClick={generateContract} disabled={generating}>
                  {generating ? 'Regenerating...' : '↺ Regenerate Contract'}
                </button>
              </div>
            </div>
          )}

          {/* Already sent to DocuSeal */}
          {(c as any).docuseal_submission_id && !c.client_sig && (
            <div style={{ background: '#4C7BC915', border: '1px solid #4C7BC955', borderRadius: 8, padding: '14px 18px', color: '#7BA7E2', fontFamily: 'IBM Plex Mono', fontSize: 12 }}>
              ✉ Contract sent to client for signature via DocuSeal. Awaiting their signature.
            </div>
          )}

          {c.client_sig && !c.provider_sig && (
            <div style={{ background: '#C9A84C15', border: '1px solid #C9A84C44', borderRadius: 8, padding: '14px 18px', color: '#C9A84C', fontFamily: 'IBM Plex Mono', fontSize: 12 }}>
              ✓ Client has signed. Check your email to countersign via DocuSeal.
            </div>
          )}

          {c.client_sig && c.provider_sig && (
            <div style={{ background: '#4CAF9310', border: '1px solid #4CAF9333', borderRadius: 8, padding: '14px 18px', color: '#4CAF93', fontFamily: 'IBM Plex Mono', fontSize: 12 }}>
              ✓ Fully executed by both parties.
            </div>
          )}
        </>
      )}

      {/* Not yet at quote stage */}
      {!isQuoteApproved && !isAwaitingApproval && (
        <div className="cr-card" style={{ textAlign: 'center', padding: '40px 28px', opacity: 0.5 }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#ffffff55' }}>
            Contract generation is available once the quote has been approved by the client.
          </div>
        </div>
      )}
    </div>
  )
}
