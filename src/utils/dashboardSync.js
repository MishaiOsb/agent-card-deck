/**
 * Dashboard Sync Utility
 * ----------------------
 * Connects the Agent Card Deck to the IAI Pod Dashboard via a shared
 * Cloudflare Worker with a KV store.
 *
 * Responsibilities:
 *   - Persist config (pod, worker URL, shared token) in localStorage
 *   - Assign and persist a stable deckId per deck (so re-submits upsert
 *     rather than create duplicates)
 *   - Submit a deck to POST /deck/save
 *
 * Ownership split (see also: worker code):
 *   - Deck owns: specification (agents, backlog, timeline, etc.)
 *   - Dashboard owns: delivery state (gate, signoffs, notes)
 *   - Worker owns: revision counter (auto-increments on re-submit)
 *
 * Added: 2026-04-22
 */

const LS_POD = 'iai_deck_pod'
const LS_WORKER = 'iai_deck_worker_url'
const LS_TOKEN = 'iai_deck_token'
const LS_SUBMITTER = 'iai_deck_submitter'
// deckId is keyed by a deck fingerprint so each unique deck gets a stable ID
const LS_DECKID_PREFIX = 'iai_deck_id:'

/* ---------------------------------------------------------------------------
 * Config get/set
 * ------------------------------------------------------------------------- */

export function getConfig() {
  return {
    pod: localStorage.getItem(LS_POD) || '',
    workerUrl: localStorage.getItem(LS_WORKER) || '',
    token: localStorage.getItem(LS_TOKEN) || '',
    submitter: localStorage.getItem(LS_SUBMITTER) || '',
  }
}

export function setConfig({ pod, workerUrl, token, submitter }) {
  if (pod !== undefined) localStorage.setItem(LS_POD, (pod || '').trim())
  if (workerUrl !== undefined) localStorage.setItem(LS_WORKER, normalizeWorkerUrl(workerUrl))
  if (token !== undefined) localStorage.setItem(LS_TOKEN, (token || '').trim())
  if (submitter !== undefined) localStorage.setItem(LS_SUBMITTER, (submitter || '').trim())
}

export function isConfigured() {
  const c = getConfig()
  return !!(c.pod && c.workerUrl && c.token)
}

function normalizeWorkerUrl(u) {
  let url = (u || '').trim()
  if (!url) return ''
  // Remove trailing slash
  url = url.replace(/\/+$/, '')
  // Ensure scheme
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url
  return url
}

/* ---------------------------------------------------------------------------
 * Deck ID management
 *
 * We want each distinct deck to have a stable ID across re-submissions so
 * the worker can upsert, but a different ID for genuinely different decks
 * (e.g. a new client or a new project).
 *
 * Strategy: use a fingerprint of (companyName + projectName) as the lookup
 * key, and store/retrieve a generated UUID-like ID against it in localStorage.
 * ------------------------------------------------------------------------- */

function fingerprint(clientInfo) {
  const company = (clientInfo?.companyName || '').trim().toLowerCase()
  const project = (clientInfo?.projectName || '').trim().toLowerCase()
  return `${company}::${project}`
}

function generateId() {
  // Short, URL-safe, enough entropy for our needs
  const rand = Math.random().toString(36).slice(2, 10)
  const time = Date.now().toString(36)
  return `${time}-${rand}`
}

export function getOrCreateDeckId(clientInfo) {
  const fp = fingerprint(clientInfo)
  if (!fp || fp === '::') return generateId() // unknown fingerprint, throwaway ID
  const key = LS_DECKID_PREFIX + fp
  let id = localStorage.getItem(key)
  if (!id) {
    id = generateId()
    localStorage.setItem(key, id)
  }
  return id
}

export function getKnownDeckId(clientInfo) {
  const fp = fingerprint(clientInfo)
  if (!fp || fp === '::') return null
  return localStorage.getItem(LS_DECKID_PREFIX + fp)
}

/* ---------------------------------------------------------------------------
 * Submit
 * ------------------------------------------------------------------------- */

/**
 * Submits a deck to the dashboard via the Cloudflare Worker.
 *
 * @param {Object} args
 * @param {Object} args.clientInfo - { companyName, projectName, primaryContact, ... }
 * @param {Object} args.deck       - full deck data (agents, backlog, timeline, etc.)
 * @returns {Promise<{ok: boolean, deckId?: string, revisionsUsed?: number, firstSubmission?: boolean, error?: string, status?: number}>}
 */
export async function submitDeck({ clientInfo, deck }) {
  if (!isConfigured()) {
    return { ok: false, error: 'not-configured' }
  }

  const { pod, workerUrl, token, submitter } = getConfig()
  const deckId = getOrCreateDeckId(clientInfo)

  // Strip React-level fields (`type` is the template reference with icon components)
  // Keep only serializable spec data.
  const cleanAgents = (deck.agents || []).map(a => ({
    id: a.id,
    templateId: a.templateId,
    typeName: a.type?.name || '',
    typeColor: a.type?.color || '',
    typeSeethendo: a.type?.seethendo || null,
    data: a.data || {},
  }))

  const payload = {
    deckId,
    pod,
    clientName: clientInfo.companyName || '',
    projectName: clientInfo.projectName || '',
    submittedBy: submitter || clientInfo.presenter || '',
    deck: {
      clientInfo: { ...clientInfo },
      agents: cleanAgents,
      backlog: deck.backlog || [],
      timeline: deck.timeline || {},
      deliveryGates: deck.deliveryGates || [],
      revisionPolicy: deck.revisionPolicy || {},
      submittedAt: new Date().toISOString(),
    },
  }

  let resp
  try {
    resp = await fetch(`${workerUrl}/deck/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Deck-Token': token,
        'X-Deck-Pod': pod,
      },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    console.error('[DashboardSync] Network error:', err)
    return { ok: false, error: 'network', message: err.message }
  }

  let data
  try {
    data = await resp.json()
  } catch {
    return { ok: false, error: 'invalid-response', status: resp.status }
  }

  if (!resp.ok || !data.ok) {
    return {
      ok: false,
      error: data.error || `http-${resp.status}`,
      status: resp.status,
      message: data.message,
    }
  }

  return {
    ok: true,
    deckId: data.deckId,
    revisionsUsed: data.revisionsUsed,
    firstSubmission: data.firstSubmission,
  }
}

/**
 * Quick connectivity test — calls /deck/list with the configured token
 * and returns whether the worker responded affirmatively.
 */
export async function testConnection() {
  if (!isConfigured()) {
    return { ok: false, error: 'not-configured' }
  }
  const { pod, workerUrl, token } = getConfig()

  let resp
  try {
    resp = await fetch(`${workerUrl}/deck/list?pod=${encodeURIComponent(pod)}`, {
      method: 'GET',
      headers: {
        'X-Deck-Token': token,
        'X-Deck-Pod': pod,
      },
    })
  } catch (err) {
    return { ok: false, error: 'network', message: err.message }
  }

  let data
  try {
    data = await resp.json()
  } catch {
    return { ok: false, error: 'invalid-response', status: resp.status }
  }

  if (!resp.ok || !data.ok) {
    return {
      ok: false,
      error: data.error || `http-${resp.status}`,
      status: resp.status,
    }
  }

  return { ok: true, deckCount: data.count }
}
