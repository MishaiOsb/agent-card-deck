import { useState, useEffect } from 'react'
import DeckBuilder from './components/DeckBuilder'
import DeckPresenter from './components/DeckPresenter'
import ClientSetup from './components/ClientSetup'
import { AGENT_TYPES } from './data/agentTemplates'
import { getSharedDeckFromURL } from './utils/shareLink'
import { ClipboardIcon, TargetIcon, LinkIcon, ChartBarIcon } from './components/Icons'
import './App.css'

function rehydrateAgents(agents) {
  return agents.map(a => {
    const type = AGENT_TYPES.find(t => t.id === a.templateId)
    if (!type) return null
    return { ...a, type }
  }).filter(Boolean)
}

function App() {
  const [view, setView] = useState('home')
  const [clientInfo, setClientInfo] = useState(null)
  const [deck, setDeck] = useState(null)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('aios-theme') || 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('aios-theme', theme)
  }, [theme])

  // Check for shared deck in URL on load
  useEffect(() => {
    const shared = getSharedDeckFromURL()
    if (shared) {
      setClientInfo(shared.clientInfo)
      const rehydrated = {
        ...shared.deck,
        clientInfo: shared.clientInfo,
        agents: rehydrateAgents(shared.deck.agents),
      }
      setDeck(rehydrated)
      setView('presenter')
    }
  }, [])

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light')

  const handleClientSetup = (info) => {
    setClientInfo(info)
    setView('builder')
  }

  const handleDeckReady = (deckData) => {
    setDeck(deckData)
    setView('presenter')
  }

  const handleBackToHome = () => {
    setView('home')
    setClientInfo(null)
    setDeck(null)
    if (window.location.hash.startsWith('#share=')) {
      history.replaceState(null, '', window.location.pathname)
    }
  }

  return (
    <div className="app">
      {/* Only show fixed theme toggle outside presenter (presenter has its own in toolbar) */}
      {view !== 'presenter' && (
        <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
          <span className="theme-toggle-icon">{theme === 'light' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
          )}</span>
          <div className="theme-toggle-track">
            <div className="theme-toggle-thumb" />
          </div>
        </button>
      )}

      {view === 'home' && (
        <div className="home-screen">
          <div className="home-hero">
            <div className="logo-mark">
              <span className="logo-icon">&#9670;</span>
              <span className="logo-text">IMPLEMENT AI</span>
            </div>
            <h1>Agent Card Deck</h1>
            <p className="subtitle">Interactive specification & delivery toolkit for client presentations</p>
            <div className="home-actions">
              <button className="btn-primary" onClick={() => setView('setup')}>
                Create New Deck
              </button>
            </div>
            <div className="home-features">
              <div className="feature-card">
                <span className="feature-icon"><ClipboardIcon style={{ width: 28, height: 28 }} /></span>
                <h3>Section A + B Cards</h3>
                <p>Universal spec fields plus type-specific parameters with clear scope boundaries</p>
              </div>
              <div className="feature-card">
                <span className="feature-icon"><TargetIcon style={{ width: 28, height: 28 }} /></span>
                <h3>Live Delivery</h3>
                <p>Synchronous presentations with real-time demo, spec walkthrough, and client sign-off</p>
              </div>
              <div className="feature-card">
                <span className="feature-icon"><LinkIcon style={{ width: 28, height: 28 }} /></span>
                <h3>Share & Present</h3>
                <p>Generate shareable links for your team to present from any device</p>
              </div>
              <div className="feature-card">
                <span className="feature-icon"><ChartBarIcon style={{ width: 28, height: 28 }} /></span>
                <h3>Export & Deliver</h3>
                <p>Export completed decks as PDF or PPTX for stakeholders</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {view === 'setup' && (
        <ClientSetup
          onSubmit={handleClientSetup}
          onBack={handleBackToHome}
        />
      )}

      {view === 'builder' && (
        <DeckBuilder
          clientInfo={clientInfo}
          onPresent={handleDeckReady}
          onBack={() => setView('setup')}
          existingDeck={deck}
        />
      )}

      {view === 'presenter' && (
        <DeckPresenter
          deck={deck}
          clientInfo={clientInfo}
          onBack={() => setView('builder')}
          onHome={handleBackToHome}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}
    </div>
  )
}

export default App
