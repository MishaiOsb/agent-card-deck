import { useState } from 'react'
import { AGENT_TYPES, REVISION_POLICY, DEFAULT_TIMELINE, DELIVERY_GATES } from '../data/agentTemplates'
import AgentCard from './AgentCard'
import { AgentIcon } from './Icons'
import './DeckBuilder.css'

export default function DeckBuilder({ clientInfo, onPresent, onBack, existingDeck }) {
  const [agents, setAgents] = useState(existingDeck?.agents || [])
  const [showPicker, setShowPicker] = useState(false)
  const [activeAgent, setActiveAgent] = useState(null)
  const [timeline, setTimeline] = useState(existingDeck?.timeline || DEFAULT_TIMELINE)
  const [revisionPolicy] = useState(existingDeck?.revisionPolicy || REVISION_POLICY)
  const [backlog, setBacklog] = useState(existingDeck?.backlog || [])
  const [newBacklogItem, setNewBacklogItem] = useState('')

  const addAgent = (template) => {
    const newAgent = {
      id: `${template.id}-${Date.now()}`,
      templateId: template.id,
      type: template,
      data: {},
      revision: 0,
      status: 'draft',
      gate: 'spec',
      gateSignoffs: { spec: false, qa: false, delivery: false },
    }
    setAgents(prev => [...prev, newAgent])
    setActiveAgent(newAgent.id)
    setShowPicker(false)
  }

  const updateAgentData = (agentId, fieldId, value) => {
    setAgents(prev => prev.map(a =>
      a.id === agentId ? { ...a, data: { ...a.data, [fieldId]: value } } : a
    ))
  }

  const removeAgent = (agentId) => {
    setAgents(prev => prev.filter(a => a.id !== agentId))
    if (activeAgent === agentId) setActiveAgent(null)
  }

  const duplicateAgent = (agentId) => {
    const source = agents.find(a => a.id === agentId)
    if (!source) return
    const copy = {
      ...source,
      id: `${source.templateId}-${Date.now()}`,
      data: { ...source.data, agentName: (source.data.agentName || '') + ' (Copy)' },
      revision: 0,
      status: 'draft',
      gate: 'spec',
      gateSignoffs: { spec: false, qa: false, delivery: false },
    }
    setAgents(prev => [...prev, copy])
    setActiveAgent(copy.id)
  }

  const addBacklogItem = () => {
    if (!newBacklogItem.trim()) return
    setBacklog(prev => [...prev, { id: Date.now(), text: newBacklogItem.trim(), priority: 'Medium' }])
    setNewBacklogItem('')
  }

  const removeBacklogItem = (id) => {
    setBacklog(prev => prev.filter(b => b.id !== id))
  }

  const handlePresent = () => {
    onPresent({
      clientInfo,
      agents,
      timeline,
      revisionPolicy,
      deliveryGates: DELIVERY_GATES,
      backlog,
      createdAt: new Date().toISOString(),
    })
  }

  const activeAgentObj = agents.find(a => a.id === activeAgent)

  return (
    <div className="builder-screen">
      <div className="builder-sidebar">
        <button className="back-link" onClick={onBack}>← Client Setup</button>
        <div className="sidebar-header">
          <h3>{clientInfo.companyName}</h3>
          <p className="sidebar-subtitle">{clientInfo.projectName || 'Agent Deck'}</p>
        </div>

        <div className="sidebar-section">
          <h4>Agent Cards ({agents.length})</h4>
          <div className="agent-list">
            {agents.map(agent => (
              <div
                key={agent.id}
                className={`agent-list-item ${activeAgent === agent.id ? 'active' : ''}`}
                onClick={() => setActiveAgent(agent.id)}
              >
                <span className="agent-list-icon"><AgentIcon templateId={agent.templateId} /></span>
                <div className="agent-list-info">
                  <span className="agent-list-name">{agent.data.agentName || agent.type.name}</span>
                  <span className="agent-list-type">{agent.type.name}</span>
                </div>
                <span className={`agent-status-dot ${agent.status}`} />
              </div>
            ))}
          </div>
          <button className="btn-add-agent" onClick={() => setShowPicker(true)}>
            + Add Agent Card
          </button>
        </div>

        <div className="sidebar-section">
          <h4>Out-of-Scope Backlog</h4>
          <div className="backlog-list">
            {backlog.map(item => (
              <div key={item.id} className="backlog-item">
                <span>{item.text}</span>
                <button className="btn-remove-sm" onClick={() => removeBacklogItem(item.id)}>×</button>
              </div>
            ))}
          </div>
          <div className="backlog-input">
            <input
              value={newBacklogItem}
              onChange={e => setNewBacklogItem(e.target.value)}
              placeholder="Add backlog item..."
              onKeyDown={e => e.key === 'Enter' && addBacklogItem()}
            />
            <button className="btn-sm btn-secondary" onClick={addBacklogItem}>Add</button>
          </div>
        </div>

        <div className="sidebar-bottom">
          <button
            className="btn-primary"
            onClick={handlePresent}
            disabled={agents.length === 0}
            style={{ width: '100%' }}
          >
            Present Deck ({agents.length} cards) →
          </button>
        </div>
      </div>

      <div className="builder-main">
        {showPicker && (
          <div className="modal-overlay" onClick={() => setShowPicker(false)}>
            <div className="agent-picker" onClick={e => e.stopPropagation()}>
              <h3>Select Agent Type</h3>
              <p className="picker-subtitle">Choose the type of digital knowledge worker to add</p>
              <div className="picker-grid">
                {AGENT_TYPES.map(type => (
                  <button
                    key={type.id}
                    className="picker-card"
                    onClick={() => addAgent(type)}
                    style={{ '--agent-color': type.color }}
                  >
                    <span className="picker-icon"><AgentIcon templateId={type.id} /></span>
                    <span className="picker-name">{type.name}</span>
                    <span className="picker-desc">{type.description}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeAgentObj ? (
          <AgentCard
            agent={activeAgentObj}
            onUpdate={updateAgentData}
            onRemove={() => removeAgent(activeAgentObj.id)}
            onDuplicate={() => duplicateAgent(activeAgentObj.id)}
            revisionPolicy={revisionPolicy}
          />
        ) : (
          <div className="builder-empty">
            <div className="empty-content">
              <span className="empty-icon" style={{ color: 'var(--primary)' }}>◆</span>
              <h2>Build Your Agent Deck</h2>
              <p>Add agent cards to define the scope of each digital knowledge worker for {clientInfo.companyName}</p>
              <button className="btn-primary" onClick={() => setShowPicker(true)}>
                + Add First Agent Card
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
