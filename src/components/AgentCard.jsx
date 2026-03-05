import { useState } from 'react'
import { SECTION_A_FIELDS, FIX_VS_CHANGE } from '../data/agentTemplates'
import { AgentIcon, LockIcon, UnlockIcon } from './Icons'
import './AgentCard.css'

export default function AgentCard({ agent, onUpdate, onRemove, onDuplicate, revisionPolicy }) {
  const [activeSection, setActiveSection] = useState('sectionA')

  const handleFieldChange = (fieldId, value) => {
    onUpdate(agent.id, fieldId, value)
  }

  const renderField = (field) => {
    const value = agent.data[field.id]

    switch (field.type) {
      case 'text':
        return (
          <input
            value={value || ''}
            onChange={e => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
          />
        )

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={e => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={3}
          />
        )

      case 'select':
        return (
          <select value={value || ''} onChange={e => handleFieldChange(field.id, e.target.value)}>
            <option value="">Select...</option>
            {field.options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        )

      case 'checklist':
        return (
          <div className="checklist-field">
            {field.items.map(item => {
              const checked = (value || []).includes(item)
              return (
                <label key={item} className="checklist-item">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const current = value || []
                      handleFieldChange(field.id,
                        checked ? current.filter(i => i !== item) : [...current, item]
                      )
                    }}
                  />
                  <span>{item}</span>
                </label>
              )
            })}
          </div>
        )

      case 'steps':
        return <StepsField value={value || []} onChange={v => handleFieldChange(field.id, v)} placeholder={field.placeholder} maxSteps={field.maxSteps} />

      case 'tags':
        return <TagsField value={value || []} onChange={v => handleFieldChange(field.id, v)} placeholder={field.placeholder} />

      case 'metrics':
        return <MetricsField value={value || field.defaults || []} onChange={v => handleFieldChange(field.id, v)} />

      default:
        return <input value={value || ''} onChange={e => handleFieldChange(field.id, e.target.value)} />
    }
  }

  return (
    <div className="agent-card" style={{ '--card-color': agent.type.color }}>
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

      <div className="card-tabs">
        <button className={`tab ${activeSection === 'sectionA' ? 'active' : ''}`} onClick={() => setActiveSection('sectionA')}>
          <span className="tab-label">Section A</span>
          <span className="tab-sublabel">Universal</span>
        </button>
        <button className={`tab ${activeSection === 'sectionB' ? 'active' : ''}`} onClick={() => setActiveSection('sectionB')}>
          <span className="tab-label">Section B</span>
          <span className="tab-sublabel">{agent.type.name}</span>
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
        {activeSection === 'sectionA' && (
          <div className="section-content">
            <div className="section-header">
              <div className="section-header-info">
                <h3>Section A — Universal Specification</h3>
                <p>Fixed fields that apply to every agent card regardless of type</p>
              </div>
              <span className="section-badge section-a">A</span>
            </div>
            <div className="spec-fields">
              {SECTION_A_FIELDS.map(field => (
                <div key={field.id} className="field-group">
                  <label>
                    {field.label}
                    {field.required && <span className="required-star">*</span>}
                  </label>
                  {renderField(field)}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'sectionB' && (
          <div className="section-content">
            <div className="section-header">
              <div className="section-header-info">
                <h3>Section B — {agent.type.name} Parameters</h3>
                <p>Type-specific configuration from the {agent.type.name} parameter library</p>
              </div>
              <span className="section-badge section-b" style={{ background: agent.type.color }}>B</span>
            </div>
            <div className="spec-fields">
              {agent.type.sectionB.map(field => (
                <div key={field.id} className="field-group">
                  <label>
                    {field.label}
                    {field.required && <span className="required-star">*</span>}
                  </label>
                  {renderField(field)}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'scope' && (
          <div className="section-content">
            <div className="section-header">
              <div className="section-header-info">
                <h3>Scope & Boundaries</h3>
                <p>Define what this agent will and will not do</p>
              </div>
            </div>
            <div className="scope-section">
              <div className="scope-box in-scope">
                <h3>In Scope</h3>
                <p className="scope-hint">What this agent WILL do</p>
                <textarea
                  value={agent.data._inScope || ''}
                  onChange={e => handleFieldChange('_inScope', e.target.value)}
                  placeholder="List all capabilities and features included in this agent's scope..."
                  rows={5}
                />
              </div>
              <div className="scope-box out-scope">
                <h3>Out of Scope</h3>
                <p className="scope-hint">What this agent will NOT do (logged for future phases)</p>
                <textarea
                  value={agent.data._outOfScope || ''}
                  onChange={e => handleFieldChange('_outOfScope', e.target.value)}
                  placeholder="List features or capabilities explicitly excluded from this phase..."
                  rows={5}
                />
              </div>
              <div className="scope-box assumptions">
                <h3>Assumptions & Dependencies</h3>
                <textarea
                  value={agent.data._assumptions || ''}
                  onChange={e => handleFieldChange('_assumptions', e.target.value)}
                  placeholder="e.g. Client will provide CRM access, data files in CSV format, etc."
                  rows={4}
                />
              </div>
              <div className="scope-box acceptance">
                <h3>Acceptance Criteria</h3>
                <p className="scope-hint">How will we know this agent is performing successfully?</p>
                <textarea
                  value={agent.data._acceptanceCriteria || ''}
                  onChange={e => handleFieldChange('_acceptanceCriteria', e.target.value)}
                  placeholder="e.g. Agent books 95% of qualified calls, handles 80% of emails without escalation"
                  rows={4}
                />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'changes' && (
          <div className="section-content">
            <div className="section-header">
              <div className="section-header-info">
                <h3>Change Gate — Fix vs Change</h3>
                <p>Log changes against the signed spec. Fixes are in-scope; changes are new work.</p>
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

  const removeStep = (idx) => {
    onChange(value.filter((_, i) => i !== idx))
  }

  const moveStep = (idx, dir) => {
    const arr = [...value]
    const target = idx + dir
    if (target < 0 || target >= arr.length) return
    ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
    onChange(arr)
  }

  return (
    <div className="steps-field">
      {maxSteps && (
        <div className="steps-counter">{value.length} / {maxSteps} steps</div>
      )}
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
  const updateMetric = (idx, field, val) => {
    const updated = value.map((m, i) => i === idx ? { ...m, [field]: val } : m)
    onChange(updated)
  }

  const addMetric = () => {
    onChange([...value, { name: '', target: '', unit: '' }])
  }

  const removeMetric = (idx) => {
    onChange(value.filter((_, i) => i !== idx))
  }

  return (
    <div className="metrics-field">
      {value.map((metric, idx) => (
        <div key={idx} className="metric-row">
          <input
            className="metric-name"
            value={metric.name}
            onChange={e => updateMetric(idx, 'name', e.target.value)}
            placeholder="Metric name"
          />
          <input
            className="metric-target"
            value={metric.target}
            onChange={e => updateMetric(idx, 'target', e.target.value)}
            placeholder="Target"
          />
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
          {revisionPolicy.categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
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
