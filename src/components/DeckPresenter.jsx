import { useState } from 'react'
import { SECTION_A_FIELDS } from '../data/agentTemplates'
import { exportToPDF } from '../utils/exportPDF'
import { exportToPPTX } from '../utils/exportPPTX'
import { buildShareURL } from '../utils/shareLink'
import { AgentIcon, ShareIcon, FileTextIcon, SlidesIcon, InfoIcon, CheckCircleIcon, ClipboardIcon, TargetIcon } from './Icons'
import './DeckPresenter.css'

export default function DeckPresenter({ deck, clientInfo, onBack, onHome, theme, onToggleTheme }) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [exporting, setExporting] = useState(false)
  const [signoffs, setSignoffs] = useState({})
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareURL, setShareURL] = useState('')
  const [copied, setCopied] = useState(false)

  const slides = buildSlides(deck)
  const slide = slides[currentSlide]
  const progress = ((currentSlide + 1) / slides.length) * 100

  const prev = () => setCurrentSlide(Math.max(0, currentSlide - 1))
  const next = () => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))

  const toggleSignoff = (agentId) => {
    setSignoffs(prev => ({ ...prev, [agentId]: !prev[agentId] }))
  }

  const handleExportPDF = async () => {
    setExporting(true)
    try {
      await exportToPDF(deck, signoffs)
    } catch (err) {
      console.error('PDF export error:', err)
      alert('Error exporting PDF. See console for details.')
    }
    setExporting(false)
  }

  const handleExportPPTX = async () => {
    setExporting(true)
    try {
      await exportToPPTX(deck, signoffs)
    } catch (err) {
      console.error('PPTX export error:', err)
      alert('Error exporting PPTX. See console for details.')
    }
    setExporting(false)
  }

  const handleShare = () => {
    const url = buildShareURL(clientInfo, deck)
    setShareURL(url)
    setCopied(false)
    setShowShareModal(true)
    history.replaceState(null, '', `#share=${url.split('#share=')[1]}`)
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareURL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      const el = document.querySelector('.share-url-input')
      if (el) { el.select(); document.execCommand('copy'); setCopied(true) }
    }
  }

  return (
    <div className="presenter">
      <div className="presenter-toolbar">
        <div className="toolbar-left">
          <button className="btn-secondary btn-sm" onClick={onBack}>&larr; Edit Deck</button>
          <span className="slide-counter">{currentSlide + 1} / {slides.length}</span>
        </div>
        <div className="toolbar-center">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="toolbar-right">
          {onToggleTheme && (
            <button className="btn-theme-toolbar" onClick={onToggleTheme} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
              {theme === 'light' ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
              )}
            </button>
          )}
          <button className="btn-share btn-sm btn-icon" onClick={handleShare}>
            <ShareIcon style={{ width: 14, height: 14 }} /> Share
          </button>
          <button className="btn-accent btn-sm btn-icon" onClick={handleExportPDF} disabled={exporting}>
            <FileTextIcon style={{ width: 14, height: 14 }} /> PDF
          </button>
          <button className="btn-primary btn-sm btn-icon" onClick={handleExportPPTX} disabled={exporting}>
            <SlidesIcon style={{ width: 14, height: 14 }} /> PPTX
          </button>
        </div>
      </div>

      <div className="presenter-stage">
        <div className="slide" key={currentSlide}>
          {slide.type === 'cover' && (
            <div className="slide-cover">
              <div className="cover-logo">&#9670; <span>IMPLEMENT AI</span></div>
              <h1>{clientInfo.projectName || 'Agent Implementation Deck'}</h1>
              <div className="cover-meta">
                <span className="cover-company">{clientInfo.companyName}</span>
                <span className="cover-divider">|</span>
                <span>{clientInfo.meetingDate}</span>
                {clientInfo.presenter && <>
                  <span className="cover-divider">|</span>
                  <span>Presented by {clientInfo.presenter}</span>
                </>}
              </div>
              <div className="cover-summary">
                <span>{deck.agents.length} Agent{deck.agents.length !== 1 ? 's' : ''} Configured</span>
                <span className="cover-divider">|</span>
                <span>Timeline: {deck.timeline.totalEstimate}</span>
              </div>
            </div>
          )}

          {slide.type === 'overview' && (
            <div className="slide-overview">
              <h2>Agent Overview</h2>
              <p className="slide-subtitle">Digital knowledge workers configured for {clientInfo.companyName}</p>
              <div className="overview-grid">
                {deck.agents.map(agent => (
                  <div key={agent.id} className="overview-card" style={{ borderColor: agent.type.color }}>
                    <span className="overview-icon"><AgentIcon templateId={agent.templateId} style={{ width: 28, height: 28 }} /></span>
                    <h3>{agent.data.agentName || agent.type.name}</h3>
                    <span className="overview-type" style={{ color: agent.type.color }}>{agent.type.name}</span>
                    <p className="overview-obj">{agent.data.purpose || agent.data.objective || 'Objective not set'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {slide.type === 'agent' && (
            <div className="slide-agent">
              <div className="agent-slide-header" style={{ borderColor: slide.agent.type.color }}>
                <span className="agent-slide-icon"><AgentIcon templateId={slide.agent.templateId} style={{ width: 36, height: 36 }} /></span>
                <div>
                  <h2>{slide.agent.data.agentName || slide.agent.type.name}</h2>
                  <span className="agent-slide-badge" style={{ background: slide.agent.type.color }}>
                    {slide.agent.type.name}
                  </span>
                </div>
              </div>

              {/* Section A - Universal */}
              <div className="agent-section-label">
                <span className="section-marker section-a-marker">A</span>
                <span>Universal Specification</span>
              </div>
              <div className="agent-slide-grid">
                {SECTION_A_FIELDS.filter(f => slide.agent.data[f.id]).map(field => (
                  <div key={field.id} className="agent-slide-field">
                    <h4>{field.label}</h4>
                    <div className="field-value">
                      {renderFieldValue(field, slide.agent.data[field.id])}
                    </div>
                  </div>
                ))}
              </div>

              {/* Section B - Type-Specific */}
              {slide.agent.type.sectionB && slide.agent.type.sectionB.some(f => slide.agent.data[f.id]) && (
                <>
                  <div className="agent-section-label">
                    <span className="section-marker section-b-marker" style={{ background: slide.agent.type.color }}>B</span>
                    <span>{slide.agent.type.name} Parameters</span>
                  </div>
                  <div className="agent-slide-grid">
                    {slide.agent.type.sectionB.filter(f => slide.agent.data[f.id]).map(field => (
                      <div key={field.id} className="agent-slide-field">
                        <h4>{field.label}</h4>
                        <div className="field-value">
                          {renderFieldValue(field, slide.agent.data[field.id])}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {(slide.agent.data._inScope || slide.agent.data._outOfScope) && (
                <div className="scope-preview">
                  {slide.agent.data._inScope && (
                    <div className="scope-preview-box in">
                      <h4>In Scope</h4>
                      <p>{slide.agent.data._inScope}</p>
                    </div>
                  )}
                  {slide.agent.data._outOfScope && (
                    <div className="scope-preview-box out">
                      <h4>Out of Scope</h4>
                      <p>{slide.agent.data._outOfScope}</p>
                    </div>
                  )}
                </div>
              )}

              {slide.agent.data._acceptanceCriteria && (
                <div className="acceptance-preview">
                  <h4>Acceptance Criteria</h4>
                  <p>{slide.agent.data._acceptanceCriteria}</p>
                </div>
              )}

              <div className="signoff-row">
                <label className="signoff-check">
                  <input
                    type="checkbox"
                    checked={!!signoffs[slide.agent.id]}
                    onChange={() => toggleSignoff(slide.agent.id)}
                  />
                  <span>Client sign-off for {slide.agent.data.agentName || slide.agent.type.name}</span>
                </label>
              </div>
            </div>
          )}

          {slide.type === 'gates' && (
            <div className="slide-gates">
              <h2>Delivery Gates</h2>
              <p className="slide-subtitle">Three checkpoints from specification to live delivery</p>
              <div className="gates-flow">
                {(deck.deliveryGates || []).map((gate, idx) => (
                  <div key={gate.id} className="gate-card">
                    <div className="gate-number">{idx + 1}</div>
                    <div className="gate-icon">
                      {gate.id === 'spec' && <ClipboardIcon style={{ width: 28, height: 28 }} />}
                      {gate.id === 'qa' && <CheckCircleIcon style={{ width: 28, height: 28 }} />}
                      {gate.id === 'delivery' && <TargetIcon style={{ width: 28, height: 28 }} />}
                    </div>
                    <h3>{gate.name}</h3>
                    <p>{gate.description}</p>
                    {idx < (deck.deliveryGates || []).length - 1 && <div className="gate-arrow">&rarr;</div>}
                  </div>
                ))}
              </div>
              <div className="fix-change-section">
                <h3>Fix vs Change Gate</h3>
                <div className="fix-change-grid">
                  <div className="fc-card fix">
                    <h4>Fix (In-Scope)</h4>
                    <p>Agent not performing to signed spec. Covered under agreement.</p>
                  </div>
                  <div className="fc-card change">
                    <h4>Change Request</h4>
                    <p>New work not in the Agent Card. Assessed and scoped separately.</p>
                  </div>
                  <div className="fc-card out-of-type">
                    <h4>Out-of-Type</h4>
                    <p>Requires a new agent card entirely. Falls outside current type.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {slide.type === 'timeline' && (
            <div className="slide-timeline">
              <h2>Project Timeline</h2>
              <p className="slide-subtitle">Estimated delivery: {deck.timeline.totalEstimate}</p>
              <div className="timeline-phases">
                {deck.timeline.phases.map((phase, idx) => (
                  <div key={idx} className="timeline-phase">
                    <div className="phase-number">{idx + 1}</div>
                    <div className="phase-info">
                      <h3>{phase.name}</h3>
                      <span className="phase-duration">{phase.duration}</span>
                    </div>
                    {idx < deck.timeline.phases.length - 1 && <div className="phase-connector" />}
                  </div>
                ))}
              </div>
              <div className="revision-policy-card">
                <h3>Revision Policy</h3>
                <p>{deck.revisionPolicy.description}</p>
              </div>
            </div>
          )}

          {slide.type === 'backlog' && deck.backlog.length > 0 && (
            <div className="slide-backlog">
              <h2>Future Phase Backlog</h2>
              <p className="slide-subtitle">Items logged for consideration in future phases</p>
              <div className="backlog-table">
                <div className="backlog-row header">
                  <span>#</span>
                  <span>Item</span>
                  <span>Priority</span>
                </div>
                {deck.backlog.map((item, idx) => (
                  <div key={item.id} className="backlog-row">
                    <span>{idx + 1}</span>
                    <span>{item.text}</span>
                    <span className={`priority-badge ${item.priority.toLowerCase()}`}>{item.priority}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {slide.type === 'summary' && (
            <div className="slide-summary">
              <h2>Summary & Next Steps</h2>
              <div className="summary-grid">
                <div className="summary-card">
                  <h3>Agents Configured</h3>
                  <span className="summary-number">{deck.agents.length}</span>
                </div>
                <div className="summary-card">
                  <h3>Signed Off</h3>
                  <span className="summary-number">
                    {Object.values(signoffs).filter(Boolean).length} / {deck.agents.length}
                  </span>
                </div>
                <div className="summary-card">
                  <h3>Backlog Items</h3>
                  <span className="summary-number">{deck.backlog.length}</span>
                </div>
                <div className="summary-card">
                  <h3>Est. Timeline</h3>
                  <span className="summary-number">{deck.timeline.totalEstimate}</span>
                </div>
              </div>
              <div className="next-steps">
                <h3>Next Steps</h3>
                <div className="next-step-list">
                  <div className="next-step">1. Review and sign off agent specifications (Gate 1)</div>
                  <div className="next-step">2. Client provides required data sources and access</div>
                  <div className="next-step">3. Development & configuration phase begins</div>
                  <div className="next-step">4. Internal QA against signed spec (Gate 2)</div>
                  <div className="next-step">5. Live delivery call — demo and sign-off (Gate 3)</div>
                </div>
              </div>
              <div className="export-cta">
                <p>Export or share this deck with stakeholders:</p>
                <div className="export-buttons">
                  <button className="btn-share btn-icon" onClick={handleShare}>
                    <ShareIcon style={{ width: 16, height: 16 }} /> Share Link
                  </button>
                  <button className="btn-accent btn-icon" onClick={handleExportPDF} disabled={exporting}>
                    <FileTextIcon style={{ width: 16, height: 16 }} /> Download PDF
                  </button>
                  <button className="btn-primary btn-icon" onClick={handleExportPPTX} disabled={exporting}>
                    <SlidesIcon style={{ width: 16, height: 16 }} /> Download PPTX
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="presenter-nav">
        <button className="nav-btn" onClick={prev} disabled={currentSlide === 0}>
          &larr; Previous
        </button>
        <div className="slide-dots">
          {slides.map((s, idx) => (
            <button
              key={idx}
              className={`dot ${idx === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(idx)}
              title={s.title}
            />
          ))}
        </div>
        <button className="nav-btn" onClick={next} disabled={currentSlide === slides.length - 1}>
          Next &rarr;
        </button>
      </div>

      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="share-modal" onClick={e => e.stopPropagation()}>
            <div className="share-modal-header">
              <h3>Share This Deck</h3>
              <button className="share-close" onClick={() => setShowShareModal(false)}>&times;</button>
            </div>
            <p className="share-desc">
              Anyone with this link can open and present this deck. All agent data is encoded in the URL — no sign-in required.
            </p>
            <div className="share-url-row">
              <input
                className="share-url-input"
                value={shareURL}
                readOnly
                onClick={e => e.target.select()}
              />
              <button className="btn-primary btn-sm" onClick={handleCopyLink}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="share-note">
              <span className="share-note-icon"><InfoIcon style={{ width: 16, height: 16 }} /></span>
              <span>The link contains the full deck data. Changes made after sharing won't update existing links.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function buildSlides(deck) {
  const slides = [
    { type: 'cover', title: 'Cover' },
    { type: 'overview', title: 'Overview' },
  ]

  deck.agents.forEach(agent => {
    slides.push({
      type: 'agent',
      title: agent.data.agentName || agent.type.name,
      agent,
    })
  })

  // Delivery gates slide
  if (deck.deliveryGates && deck.deliveryGates.length > 0) {
    slides.push({ type: 'gates', title: 'Delivery Gates' })
  }

  slides.push({ type: 'timeline', title: 'Timeline' })

  if (deck.backlog.length > 0) {
    slides.push({ type: 'backlog', title: 'Backlog' })
  }

  slides.push({ type: 'summary', title: 'Summary' })

  return slides
}

function renderFieldValue(field, value) {
  if (!value) return <span className="no-data">Not set</span>

  if (field.type === 'checklist' && Array.isArray(value)) {
    return (
      <div className="present-checklist">
        {value.map(v => <span key={v} className="check-item">&#10003; {v}</span>)}
      </div>
    )
  }

  if (field.type === 'steps' && Array.isArray(value)) {
    return (
      <div className="present-steps">
        {value.map((v, i) => (
          <div key={i} className="present-step">
            <span className="pstep-num">{i + 1}</span>
            <span>{v}</span>
          </div>
        ))}
      </div>
    )
  }

  if (field.type === 'tags' && Array.isArray(value)) {
    return (
      <div className="present-tags">
        {value.map(v => <span key={v} className="ptag">{v}</span>)}
      </div>
    )
  }

  if (field.type === 'metrics' && Array.isArray(value)) {
    return (
      <div className="present-metrics">
        {value.filter(m => m.name).map((m, i) => (
          <div key={i} className="pmetric">
            <span className="pmetric-name">{m.name}</span>
            <span className="pmetric-target">{m.target}</span>
          </div>
        ))}
      </div>
    )
  }

  return <p>{String(value)}</p>
}
