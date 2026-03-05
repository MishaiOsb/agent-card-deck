import { useState } from 'react'
import './ClientSetup.css'

export default function ClientSetup({ onSubmit, onBack }) {
  const [form, setForm] = useState({
    companyName: '',
    contactName: '',
    contactRole: '',
    contactEmail: '',
    industry: '',
    projectName: '',
    meetingDate: new Date().toISOString().split('T')[0],
    presenter: '',
  })

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.companyName || !form.contactName) return
    onSubmit(form)
  }

  return (
    <div className="setup-screen">
      <div className="setup-container">
        <button className="back-link" onClick={onBack}>← Back to Home</button>
        <div className="setup-header">
          <h2>Client Setup</h2>
          <p>Enter client details to personalize the deck</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="setup-grid">
            <div className="field-group">
              <label>Company Name *</label>
              <input value={form.companyName} onChange={e => update('companyName', e.target.value)} placeholder="Acme Corporation" required />
            </div>
            <div className="field-group">
              <label>Project Name</label>
              <input value={form.projectName} onChange={e => update('projectName', e.target.value)} placeholder="AI Agent Implementation" />
            </div>
            <div className="field-group">
              <label>Primary Contact *</label>
              <input value={form.contactName} onChange={e => update('contactName', e.target.value)} placeholder="John Smith" required />
            </div>
            <div className="field-group">
              <label>Contact Role</label>
              <input value={form.contactRole} onChange={e => update('contactRole', e.target.value)} placeholder="VP of Operations" />
            </div>
            <div className="field-group">
              <label>Contact Email</label>
              <input type="email" value={form.contactEmail} onChange={e => update('contactEmail', e.target.value)} placeholder="john@acme.com" />
            </div>
            <div className="field-group">
              <label>Industry</label>
              <input value={form.industry} onChange={e => update('industry', e.target.value)} placeholder="e.g. Healthcare, Finance, Retail" />
            </div>
            <div className="field-group">
              <label>Meeting Date</label>
              <input type="date" value={form.meetingDate} onChange={e => update('meetingDate', e.target.value)} />
            </div>
            <div className="field-group">
              <label>Presenter</label>
              <input value={form.presenter} onChange={e => update('presenter', e.target.value)} placeholder="Your name" />
            </div>
          </div>
          <div className="setup-actions">
            <button type="submit" className="btn-primary">Continue to Deck Builder →</button>
          </div>
        </form>
      </div>
    </div>
  )
}
