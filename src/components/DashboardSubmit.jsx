import { useState, useEffect } from 'react'
import {
  getConfig,
  setConfig,
  isConfigured,
  submitDeck,
  testConnection,
  getKnownDeckId,
} from '../utils/dashboardSync'
import { CheckCircleIcon, AlertTriangleIcon, CogIcon } from './Icons'
import './DashboardSubmit.css'

/**
 * DashboardSubmit
 * ---------------
 * Modal that handles both first-time configuration and the submit flow.
 *
 * States:
 *   'settings'   — entering pod / worker URL / token
 *   'confirm'    — ready to submit, showing summary + confirm button
 *   'submitting' — in-flight request
 *   'success'    — submit confirmed
 *   'error'      — submit failed, show retry
 *
 * Opens in 'settings' if not configured, 'confirm' otherwise.
 */
export default function DashboardSubmit({ clientInfo, deck, onClose }) {
  const [mode, setMode] = useState(isConfigured() ? 'confirm' : 'settings')
  const [config, setLocalConfig] = useState(() => getConfig())
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [submitResult, setSubmitResult] = useState(null)

  const existingDeckId = getKnownDeckId(clientInfo)

  useEffect(() => {
    // Close on Escape
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const saveSettings = () => {
    setConfig(config)
    setTestResult(null)
    if (isConfigured()) {
      setMode('confirm')
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    setConfig(config) // persist before testing
    const result = await testConnection()
    setTestResult(result)
    setTesting(false)
  }

  const handleSubmit = async () => {
    setMode('submitting')
    const result = await submitDeck({ clientInfo, deck })
    setSubmitResult(result)
    setMode(result.ok ? 'success' : 'error')
  }

  return (
    <div className="ds-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="ds-modal">
        <div className="ds-header">
          <h3>
            {mode === 'settings' && 'Dashboard Settings'}
            {mode === 'confirm' && 'Submit to Dashboard'}
            {mode === 'submitting' && 'Submitting…'}
            {mode === 'success' && 'Submitted Successfully'}
            {mode === 'error' && 'Submission Failed'}
          </h3>
          <button className="ds-close" onClick={onClose}>&times;</button>
        </div>

        {mode === 'settings' && (
          <div className="ds-body">
            <p className="ds-sub">
              Connect this deck app to the IAI Pod Dashboard. You only need to do this once.
            </p>

            <div className="ds-field">
              <label>Pod</label>
              <input
                type="text"
                value={config.pod}
                onChange={(e) => setLocalConfig({ ...config, pod: e.target.value })}
                placeholder="pod-b"
              />
              <small>Your pod identifier (e.g. <code>pod-b</code>). Decks are namespaced per pod.</small>
            </div>

            <div className="ds-field">
              <label>Cloudflare Worker URL</label>
              <input
                type="text"
                value={config.workerUrl}
                onChange={(e) => setLocalConfig({ ...config, workerUrl: e.target.value })}
                placeholder="https://your-worker.your-subdomain.workers.dev"
              />
              <small>The same worker URL your dashboard uses for Slack / AI proxy.</small>
            </div>

            <div className="ds-field">
              <label>Shared Token</label>
              <input
                type="password"
                value={config.token}
                onChange={(e) => setLocalConfig({ ...config, token: e.target.value })}
                placeholder="Your DECK_SHARED_TOKEN"
              />
              <small>The <code>DECK_SHARED_TOKEN</code> secret from your worker.</small>
            </div>

            <div className="ds-field">
              <label>Your Name (optional)</label>
              <input
                type="text"
                value={config.submitter}
                onChange={(e) => setLocalConfig({ ...config, submitter: e.target.value })}
                placeholder="e.g. Mishai"
              />
              <small>Displayed in the dashboard as "submitted by".</small>
            </div>

            {testResult && (
              <div className={`ds-result ${testResult.ok ? 'ok' : 'err'}`}>
                {testResult.ok ? (
                  <><CheckCircleIcon style={{ width: 16, height: 16 }} /> Connected — {testResult.deckCount} deck{testResult.deckCount === 1 ? '' : 's'} in this pod</>
                ) : (
                  <><AlertTriangleIcon style={{ width: 16, height: 16 }} /> {formatError(testResult)}</>
                )}
              </div>
            )}

            <div className="ds-actions">
              <button
                className="ds-btn-secondary"
                onClick={handleTest}
                disabled={testing || !config.pod || !config.workerUrl || !config.token}
              >
                {testing ? 'Testing…' : 'Test Connection'}
              </button>
              <button
                className="ds-btn-primary"
                onClick={saveSettings}
                disabled={!config.pod || !config.workerUrl || !config.token}
              >
                Save
              </button>
            </div>
          </div>
        )}

        {mode === 'confirm' && (
          <div className="ds-body">
            <p className="ds-sub">
              This will submit the deck to the dashboard where it'll be tracked through delivery.
            </p>

            <div className="ds-summary">
              <div className="ds-summary-row">
                <span className="ds-summary-label">Client</span>
                <span className="ds-summary-value">{clientInfo.companyName || '—'}</span>
              </div>
              <div className="ds-summary-row">
                <span className="ds-summary-label">Project</span>
                <span className="ds-summary-value">{clientInfo.projectName || '—'}</span>
              </div>
              <div className="ds-summary-row">
                <span className="ds-summary-label">Agents</span>
                <span className="ds-summary-value">{deck?.agents?.length || 0}</span>
              </div>
              <div className="ds-summary-row">
                <span className="ds-summary-label">Backlog Items</span>
                <span className="ds-summary-value">{deck?.backlog?.length || 0}</span>
              </div>
              <div className="ds-summary-row">
                <span className="ds-summary-label">Pod</span>
                <span className="ds-summary-value"><code>{config.pod}</code></span>
              </div>
              <div className="ds-summary-row">
                <span className="ds-summary-label">Status</span>
                <span className="ds-summary-value">
                  {existingDeckId
                    ? <span className="ds-tag ds-tag-warn">Re-submission (will count as a revision)</span>
                    : <span className="ds-tag ds-tag-ok">First submission</span>
                  }
                </span>
              </div>
            </div>

            <div className="ds-actions">
              <button className="ds-btn-secondary" onClick={() => setMode('settings')}>
                <CogIcon style={{ width: 14, height: 14 }} /> Settings
              </button>
              <button className="ds-btn-primary" onClick={handleSubmit}>
                Submit to Dashboard
              </button>
            </div>
          </div>
        )}

        {mode === 'submitting' && (
          <div className="ds-body ds-center">
            <div className="ds-spinner" />
            <p>Sending deck to dashboard…</p>
          </div>
        )}

        {mode === 'success' && submitResult && (
          <div className="ds-body ds-center">
            <div className="ds-success-icon">
              <CheckCircleIcon style={{ width: 48, height: 48 }} />
            </div>
            <h4>
              {submitResult.firstSubmission ? 'Deck submitted' : `Deck updated — Revision ${submitResult.revisionsUsed}`}
            </h4>
            <p className="ds-sub">
              {clientInfo.companyName}'s deck is now tracked in the dashboard.
            </p>
            {submitResult.revisionsUsed >= 2 && (
              <div className="ds-result warn">
                <AlertTriangleIcon style={{ width: 16, height: 16 }} />
                Revision {submitResult.revisionsUsed} of 3 — consider finalising the spec.
              </div>
            )}
            <div className="ds-actions ds-actions-center">
              <button className="ds-btn-primary" onClick={onClose}>Done</button>
            </div>
          </div>
        )}

        {mode === 'error' && submitResult && (
          <div className="ds-body">
            <div className="ds-result err">
              <AlertTriangleIcon style={{ width: 16, height: 16 }} />
              {formatError(submitResult)}
            </div>
            <p className="ds-sub">
              Check your worker URL and token are correct, and that the worker is deployed with the <code>/deck/save</code> route.
            </p>
            <div className="ds-actions">
              <button className="ds-btn-secondary" onClick={() => setMode('settings')}>
                <CogIcon style={{ width: 14, height: 14 }} /> Edit Settings
              </button>
              <button className="ds-btn-primary" onClick={handleSubmit}>
                Retry
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function formatError(result) {
  if (!result) return 'Unknown error'
  switch (result.error) {
    case 'not-configured': return 'Not configured yet. Enter pod, worker URL and token.'
    case 'network': return `Network error: ${result.message || 'could not reach worker'}`
    case 'unauthorized': return 'Unauthorized — check your shared token matches the one on the worker.'
    case 'not-found': return 'Deck not found on worker (this should not happen on submit).'
    case 'missing-fields': return 'Missing required fields in request.'
    case 'invalid-json': return 'Worker rejected the payload as invalid JSON.'
    case 'storage-failed': return 'Worker could not write to KV. Check the DECKS binding in worker settings.'
    case 'invalid-response': return `Worker returned a non-JSON response (HTTP ${result.status}). Is the /deck/save route installed?`
    default:
      if (result.error?.startsWith('http-')) {
        return `Worker returned HTTP ${result.status}${result.message ? ': ' + result.message : ''}`
      }
      return `Error: ${result.error}${result.message ? ' — ' + result.message : ''}`
  }
}
