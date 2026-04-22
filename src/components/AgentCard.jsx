import { useState } from 'react'
import {
  SECTION_A_FIELDS,
  FIX_VS_CHANGE,
  groupSectionBByCategory,
  PRIORITY_BADGES,
} from '../data/agentTemplates'
import { AgentIcon } from './Icons'
import './AgentCard.css'

/**
 * AgentCard — streamlined builder inspired by the IAI Call Prep template.
 *
 * Every field is rendered as a "q-block" with:
 *   - Natural-language question as the primary label
 *   - Why-this-matters helper text (muted)
 *   - Priority badge (Must / Should / Nice)
 *   - Input (the "capture box") — for manual entry; Fireflies can pre-fill later
 *
 * Section B fields are grouped into numbered category blocks.
 * The "Must Have only" filter hides Should/Nice fields for focused meetings.
 */
export default function AgentCard({ agent, onUpdate, onRemove, onDuplicate, revisionPolicy }) {
  const [activeSection, setActiveSection] = useState('spec')
  const [mustOnly, setMustOnly] = useState(false)
  const [showGuidance, setShowGuidance] = useState(true)

  const handleFieldChange = (fieldId, value) => {
    onUpdate(agent.id, fieldId, value)
  }

  const sectionBGroups = groupSectionBByCategory(agent.type.sectionB)

  const passesFilter = (field) => {
    if (!mustOnly) return true
    return field.priority === 'must'
  }

  // Section A shown as a single block; Section B as category blocks.
  // Block numbering is continuous across Section A and Section B.
  const visibleASectionFields = SECTION_A_FIELDS.filter(passesFilter)
  const visibleBGroups = sectionBGroups
    .map(g => ({ ...g, fields: g.fields.filter(passesFilter) }))
    .filter(g => g.fields.length > 0)

  let blockNumber = 0

  return (
    <div className="agent-card" style={{ '--card-color': agent.type.color }}>
      {/* ========== Header ========== */}
      <div className="card-header">
        <div className="card-header-left">
          <span className="card-icon"><AgentIcon templateId={agent.templateId} /></span>
          <div>
            <h2 className="card-title">{agent.data.agentName || agent.type.name}</h2>
            <span className="card-type-badge" style={{ background: agent.type.color }}>{agent.type.name}</span>
          </div>
        </div>
        <div className="card-header-actions">
          <span className="revision-badge">Rev {agent.revision}/{revisionPolicy.maxRevisions}</span>
          <button className="btn-sm btn-secondary" onClick={onDuplicate}>Duplicate</button>
          <button className="btn-sm btn-danger" onClick={onRemove}>Remove</button>
        </div>
      </div>

      {/* ========== Tab nav (simplified) ========== */}
      <div className="card-tabs">
        <button className={`tab ${activeSection === 'spec' ? 'active' : ''}`} onClick={() => setActiveSection('spec')}>
          <span className="tab-label">Spec</span>
          <span className="tab-sublabel">Section A + B</span>
        </button>
        <button className={`tab ${activeSection === 'scope' ? 'active' : ''}`} onClick={() => setActiveSection('scope')}>
          <span className="tab-label">Scope</span>
          <span className="tab-sublabel">Boundaries</span>
        </button>
        <button className={`tab ${activeSection === 'changes' ? 'active' : ''}`} onClick={() => setActiveSection('changes')}>
          <span className="tab-label">Changes</span>
          <span className="tab-sublabel">Fix / Change</span>
        </button>
      </div>

      <div className="card-body">
        {/* ========================================================== */}
        {/*  SPEC — Section A + B as numbered q-blocks                  */}
        {/* ========================================================== */}
        {activeSection === 'spec' && (
          <div className="section-content">
            {/* Toolbar: filter + guidance toggle */}
            <div className="spec-toolbar">
              <div className="spec-label-group">
                <div className="section-label">Specification</div>
                <h3 className="section-title">Capture the agent, one question at a time</h3>
              </div>
              <div className="spec-toolbar-actions">
                <label className="toggle-pill">
                  <input
                    type="checkbox"
                    checked={mustOnly}
                    onChange={e => setMustOnly(e.target.checked)}
                  />
                  <span>Must Haves only</span>
                </label>
                <button
                  className="btn-sm btn-ghost"
                  onClick={() => setShowGuidance(v => !v)}
                  title="Toggle help text"
                >
                  {showGuidance ? 'Hide guidance' : 'Show guidance'}
                </button>
              </div>
            </div>

            {showGuidance && (
              <div className="template-guidance">
                <strong>How to use this</strong>
                <p>
                  Each field is a question you can ask the client verbatim. The grey text under each
                  question is <em>why it matters</em>. Use the priority badges to focus on
                  <span className="inline-badge must">Must Have</span> fields first if time is short.
                  Fireflies will auto-populate answers in future; for now, fill manually as the call goes.
                </p>
              </div>
            )}

            {/* Section A — Universal */}
            {visibleASectionFields.length > 0 && (
              <QBlock
                number={++blockNumber}
                category="Agent Essentials"
                sublabel="Universal Specification — applies to every agent"
                color="var(--card-color)"
              >
                {visibleASectionFields.map(field => (
                  <QField
                    key={field.id}
                    field={field}
                    value={agent.data[field.id]}
                    onChange={v => handleFieldChange(field.id, v)}
                    showGuidance={showGuidance}
                  />
                ))}
              </QBlock>
            )}

            {/* Section B — grouped by category */}
            {visibleBGroups.map(group => (
              <QBlock
                key={group.category}
                number={++blockNumber}
                category={group.category}
                sublabel={`${agent.type.name} parameters`}
                color="var(--card-color)"
              >
                {group.fields.map(field => (
                  <QField
                    key={field.id}
                    field={field}
                    value={agent.data[field.id]}
                    onChange={v => handleFieldChange(field.id, v)}
                    showGuidance={showGuidance}
                  />
                ))}
              </QBlock>
            ))}

            {mustOnly && visibleBGroups.length === 0 && visibleASectionFields.length === 0 && (
              <div className="empty-filter-state">
                No Must Have fields for this agent type. Disable the filter to see all fields.
              </div>
            )}
          </div>
        )}

        {/* ========================================================== */}
        {/*  SCOPE — two-column in/out + assumptions + acceptance       */}
        {/* ========================================================== */}
        {activeSection === 'scope' && (
          <div className="section-content">
            <div className="spec-toolbar">
              <div className="spec-label-group">
                <div className="section-label">Scope</div>
                <h3 className="section-title">What this agent will — and won't — do</h3>
              </div>
            </div>

            <div className="scope-grid">
              <div className="scope-col in-scope">
                <div className="scope-col-header">
                  <span className="scope-dot" />
                  <h4>In Scope</h4>
                </div>
                <p className="scope-why">What this agent WILL do. This is what we're signing off and building against.</p>
                <textarea
                  value={agent.data._inScope || ''}
                  onChange={e => handleFieldChange('_inScope', e.target.value)}
                  placeholder="List all capabilities and features included..."
                  rows={6}
                />
              </div>
              <div className="scope-col out-scope">
                <div className="scope-col-header">
                  <span className="scope-dot" />
                  <h4>Out of Scope</h4>
                </div>
                <p className="scope-why">What this agent will NOT do. Future phases; changes here become Change Requests.</p>
                <textarea
                  value={agent.data._outOfScope || ''}
                  onChange={e => handleFieldChange('_outOfScope', e.target.value)}
                  placeholder="Explicitly excluded capabilities..."
                  rows={6}
                />
              </div>
            </div>

            <div className="scope-extras">
              <div className="info-box violet">
                <h4>Assumptions &amp; Dependencies</h4>
                <p className="scope-why">What we need from the client, or what we're assuming is true. Flag here so nothing blocks Gate 2.</p>
                <textarea
                  value={agent.data._assumptions || ''}
                  onChange={e => handleFieldChange('_assumptions', e.target.value)}
                  placeholder="e.g. Client provides CRM API access by end of Week 1..."
                  rows={4}
                />
              </div>
              <div className="info-box teal">
                <h4>Acceptance Criteria</h4>
                <p className="scope-why">How we'll prove the agent is ready for Gate 3 sign-off. Tie back to Success Metrics.</p>
                <textarea
                  value={agent.data._acceptanceCriteria || ''}
                  onChange={e => handleFieldChange('_acceptanceCriteria', e.target.value)}
                  placeholder="e.g. Agent books 95% of qualified calls, handles 80% of emails without escalation..."
                  rows={4}
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/*  CHANGES — fix vs change log                                */}
        {/* ========================================================== */}
        {activeSection === 'changes' && (
          <div className="section-content">
            <div className="spec-toolbar">
              <div className="spec-label-group">
                <div className="section-label">Change Gate</div>
                <h3 className="section-title">Fix vs Change</h3>
                <p className="section-sub">Log issues against the signed spec. Fixes are in-scope; changes are new work.</p>
              </div>
            </div>
            <FixVsChangeInfo />
            <ChangeLog
              changes={agent.data._changes || []}
              onChange={v => handleFieldChange('_changes', v)}
              revisionPolicy={revisionPolicy}
              currentRevision={agent.revision}
            />
          </div>
        )}
      </div>
    </div>
  )
}

/* ============================================================
 * QBlock — numbered category block (like the Call Prep q-block)
 * ========================================================== */
function QBlock({ number, category, sublabel, children, color = 'var(--card-color)' }) {
  return (
    <div className="q-block" style={{ '--q-color': color }}>
      <div className="q-header">
        <span className="q-number">{number}</span>
        <div className="q-header-text">
          <div className="q-category">{category}</div>
          {sublabel && <div className="q-sublabel">{sublabel}</div>}
        </div>
      </div>
      <div className="q-body">
        {children}
      </div>
    </div>
  )
}

/* ============================================================
 * QField — single question with label, help text, priority, input
 * ========================================================== */
function QField({ field, value, onChange, showGuidance }) {
  const priority = field.priority || 'nice'
  const badge = PRIORITY_BADGES[priority]
  const questionText = field.question || field.label

  return (
    <div className="q-field">
      <div className="q-field-header">
        <div className="q-field-question">
          &ldquo;{questionText}&rdquo;
          {field.required && <span className="required-star"> *</span>}
        </div>
        {badge && (
          <span
            className={`priority-badge priority-${priority}`}
            style={{ background: badge.bg, color: badge.fg }}
          >
            {badge.label}
          </span>
        )}
      </div>
      {showGuidance && field.helpText && (
        <div className="q-field-why">{field.helpText}</div>
      )}
      <div className="q-field-input">
        {renderInput(field, value, onChange)}
      </div>
    </div>
  )
}

/* ============================================================
 * Input renderers
 * ========================================================== */
function renderInput(field, value, onChange) {
  switch (field.type) {
    case 'text':
      return <input value={value || ''} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} />

    case 'textarea':
      return <textarea value={value || ''} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} rows={3} />

    case 'select':
      return (
        <select value={value || ''} onChange={e => onChange(e.target.value)}>
          <option value="">Select...</option>
          {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      )

    case 'checklist':
      return <ChecklistField items={field.items} value={value || []} onChange={onChange} />

    case 'steps':
      return <StepsField value={value || []} onChange={onChange} placeholder={field.placeholder} maxSteps={field.maxSteps} />

    case 'tags':
      return <TagsField value={value || []} onChange={onChange} placeholder={field.placeholder} />

    case 'metrics':
      return <MetricsField value={value || field.defaults || []} onChange={onChange} />

    default:
      return <input value={value || ''} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} />
  }
}

function ChecklistField({ items, value, onChange }) {
  return (
    <div className="checklist-field">
      {items.map(item => {
        const checked = value.includes(item)
        return (
          <label key={item} className="checklist-item">
            <input
              type="checkbox"
              checked={checked}
              onChange={() => {
                onChange(checked ? value.filter(i => i !== item) : [...value, item])
              }}
            />
            <span>{item}</span>
          </label>
        )
      })}
    </div>
  )
}

function FixVsChangeInfo() {
  return (
    <div className="fix-vs-change-info">
      {Object.entries(FIX_VS_CHANGE).map(([key, def]) => (
        <div key={key} className="fvc-item" style={{ '--fvc-color': def.color }}>
          <div className="fvc-header">
            <span className="fvc-dot" style={{ background: def.color }} />
            <strong>{def.label}</strong>
          </div>
          <p>{def.description}</p>
        </div>
      ))}
    </div>
  )
}

function StepsField({ value, onChange, placeholder, maxSteps }) {
  const [input, setInput] = useState('')

  const addStep = () => {
    if (!input.trim()) return
    if (maxSteps && value.length >= maxSteps) return
    onChange([...value, input.trim()])
    setInput('')
  }

  const removeStep = (idx) => onChange(value.filter((_, i) => i !== idx))

  const moveStep = (idx, dir) => {
    const arr = [...value]
    const target = idx + dir
    if (target < 0 || target >= arr.length) return
    ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
    onChange(arr)
  }

  return (
    <div className="steps-field">
      {maxSteps && <div className="steps-counter">{value.length} / {maxSteps} steps</div>}
      <div className="steps-list">
        {value.map((step, idx) => (
          <div key={idx} className="step-item">
            <span className="step-number">{idx + 1}</span>
            <span className="step-text">{step}</span>
            <div className="step-actions">
              <button onClick={() => moveStep(idx, -1)} disabled={idx === 0}>&#8593;</button>
              <button onClick={() => moveStep(idx, 1)} disabled={idx === value.length - 1}>&#8595;</button>
              <button onClick={() => removeStep(idx)}>&times;</button>
            </div>
          </div>
        ))}
      </div>
      <div className="step-input">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={placeholder}
          onKeyDown={e => e.key === 'Enter' && addStep()}
          disabled={maxSteps && value.length >= maxSteps}
        />
        <button className="btn-sm btn-secondary" onClick={addStep} disabled={maxSteps && value.length >= maxSteps}>Add</button>
      </div>
    </div>
  )
}

function TagsField({ value, onChange, placeholder }) {
  const [input, setInput] = useState('')

  const addTag = () => {
    const tag = input.trim()
    if (!tag || value.includes(tag)) return
    onChange([...value, tag])
    setInput('')
  }

  return (
    <div className="tags-field">
      <div className="tags-list">
        {value.map(tag => (
          <span key={tag} className="tag">
            {tag}
            <button onClick={() => onChange(value.filter(t => t !== tag))}>&times;</button>
          </span>
        ))}
      </div>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder={placeholder}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            addTag()
          }
        }}
      />
    </div>
  )
}

function MetricsField({ value, onChange }) {
  const updateMetric = (idx, fieldName, val) => {
    onChange(value.map((m, i) => i === idx ? { ...m, [fieldName]: val } : m))
  }

  const addMetric = () => onChange([...value, { name: '', target: '', unit: '' }])
  const removeMetric = (idx) => onChange(value.filter((_, i) => i !== idx))

  return (
    <div className="metrics-field">
      {value.map((metric, idx) => (
        <div key={idx} className="metric-row">
          <input className="metric-name" value={metric.name} onChange={e => updateMetric(idx, 'name', e.target.value)} placeholder="Metric name" />
          <input className="metric-target" value={metric.target} onChange={e => updateMetric(idx, 'target', e.target.value)} placeholder="Target" />
          <button className="btn-remove-sm" onClick={() => removeMetric(idx)}>&times;</button>
        </div>
      ))}
      <button className="btn-sm btn-secondary" onClick={addMetric}>+ Add Metric</button>
    </div>
  )
}

function ChangeLog({ changes, onChange, revisionPolicy, currentRevision }) {
  const [input, setInput] = useState('')
  const [category, setCategory] = useState('Fix (In-Scope)')

  const addChange = () => {
    if (!input.trim()) return
    onChange([...changes, {
      id: Date.now(),
      text: input.trim(),
      category,
      date: new Date().toLocaleDateString(),
      status: 'Pending'
    }])
    setInput('')
  }

  const updateStatus = (id, status) => {
    onChange(changes.map(c => c.id === id ? { ...c, status } : c))
  }

  const getCategoryColor = (cat) => {
    if (cat.includes('Fix')) return FIX_VS_CHANGE.fix.color
    if (cat.includes('Out-of-Type')) return FIX_VS_CHANGE.outOfType.color
    return FIX_VS_CHANGE.change.color
  }

  return (
    <div className="change-log">
      <div className="change-policy">
        <h3>Revision Policy</h3>
        <p>{revisionPolicy.description}</p>
        <div className="revision-meter">
          <div className="revision-bar">
            <div className="revision-fill" style={{ width: `${(currentRevision / revisionPolicy.maxRevisions) * 100}%` }} />
          </div>
          <span>{currentRevision} of {revisionPolicy.maxRevisions} revisions used</span>
        </div>
      </div>

      <div className="change-add">
        <select value={category} onChange={e => setCategory(e.target.value)}>
          {revisionPolicy.categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Describe the fix or change request..."
          onKeyDown={e => e.key === 'Enter' && addChange()}
        />
        <button className="btn-sm btn-primary" onClick={addChange}>Log</button>
      </div>

      <div className="change-list">
        {changes.length === 0 && <p className="no-changes">No changes logged yet</p>}
        {changes.map(change => (
          <div key={change.id} className="change-item">
            <div className="change-info">
              <span className="change-category" style={{ background: getCategoryColor(change.category) + '20', color: getCategoryColor(change.category) }}>
                {change.category}
              </span>
              <span className="change-text">{change.text}</span>
              <span className="change-date">{change.date}</span>
            </div>
            <select value={change.status} onChange={e => updateStatus(change.id, e.target.value)} className="change-status">
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Complete">Complete</option>
              <option value="Deferred">Deferred</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}
