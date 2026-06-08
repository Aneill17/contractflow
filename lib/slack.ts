// ── Slack notifications ───────────────────────────────────────
// Uses SLACK_WEBHOOK_URL env var pointing to an incoming webhook
// for the #contractflow-updates channel.

const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL

export async function sendSlackNotification(message: string, blocks?: object[]) {
  if (!SLACK_WEBHOOK) {
    console.warn('[slack] SLACK_WEBHOOK_URL not set — skipping notification')
    return
  }
  try {
    await fetch(SLACK_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(blocks ? { blocks } : { text: message }),
    })
  } catch (e) {
    console.error('[slack] Failed to send notification:', e)
  }
}

// ── Typed notification helpers ────────────────────────────────

export async function notifyStaffChange(opts: {
  contractLocation: string
  companyName: string
  unitAddress: string
  outgoingName: string
  outgoingDate: string
  incomingName?: string | null
  incomingDate?: string | null
  requestedBy: string
}) {
  const msg =
    `🔄 *Staff Change* — ${opts.contractLocation}\n` +
    `Client: ${opts.companyName}\n` +
    `Unit: ${opts.unitAddress}\n` +
    `Outgoing: ${opts.outgoingName} on ${opts.outgoingDate}\n` +
    `Incoming: ${opts.incomingName ? `${opts.incomingName} on ${opts.incomingDate}` : 'TBD'}\n` +
    `Requested by: ${opts.requestedBy}`
  await sendSlackNotification(msg)
}

export async function notifyCleaningRequest(opts: {
  contractLocation: string
  companyName: string
  unitAddress: string
  scheduledDate: string
  notes?: string | null
  requestedBy: string
}) {
  const msg =
    `🧹 *Cleaning Request* — ${opts.contractLocation}\n` +
    `Client: ${opts.companyName}\n` +
    `Unit: ${opts.unitAddress}\n` +
    `Date needed: ${opts.scheduledDate}\n` +
    `Notes: ${opts.notes || 'none'}\n` +
    `Requested by: ${opts.requestedBy}`
  await sendSlackNotification(msg)
}

export async function notifyContractExtension(opts: {
  contractLocation: string
  companyName: string
  duration: string
  note?: string | null
  requestedBy: string
}) {
  const msg =
    `📅 *Extension Request* — ${opts.contractLocation}\n` +
    `Client: ${opts.companyName}\n` +
    `Duration: ${opts.duration}\n` +
    `Note: ${opts.note || 'none'}\n` +
    `Requested by: ${opts.requestedBy}`
  await sendSlackNotification(msg)
}

export async function notifyNoticeToEnd(opts: {
  contractLocation: string
  companyName: string
  endDate: string
  note?: string | null
  requestedBy: string
}) {
  const msg =
    `🔴 *Notice to End* — ${opts.contractLocation}\n` +
    `Client: ${opts.companyName}\n` +
    `End Date: ${opts.endDate}\n` +
    `Note: ${opts.note || 'none'}\n` +
    `Requested by: ${opts.requestedBy}`
  await sendSlackNotification(msg)
}

export async function notifyUnitCleaned(opts: {
  unitAddress: string
  markedBy: string
  contractReference: string
}) {
  const msg =
    `✅ *Unit Cleaned* — ${opts.unitAddress}\n` +
    `Marked clean by: ${opts.markedBy}\n` +
    `Contract: ${opts.contractReference}`
  await sendSlackNotification(msg)
}

export async function notifyAddNote(opts: {
  contractLocation: string
  companyName: string
  note: string
  requestedBy: string
}) {
  const msg =
    `📝 *Note Added* — ${opts.contractLocation}\n` +
    `Client: ${opts.companyName}\n` +
    `Note: ${opts.note}\n` +
    `By: ${opts.requestedBy}`
  await sendSlackNotification(msg)
}
