import './Sidebar.css';

const STATUS_COLORS = {
  RECRUITING: 'badge-green',
  COMPLETED: 'badge-blue',
  ACTIVE_NOT_RECRUITING: 'badge-amber',
  NOT_YET_RECRUITING: 'badge-purple',
};

export default function Sidebar({ 
  patientContext, 
  stats, 
  messageCount, 
  onReset,
  onLogout,
  setActivePage   // 🔥 NEW PROP
}) {
  return (
    <aside className="sidebar">
      
      {/* Logo */}
      <div className="sidebar-logo">
        <span className="sidebar-logo-icon">🔬</span>
        <div>
          <h2 className="sidebar-brand">CuraLink</h2>
          <p className="sidebar-tagline">Medical Research AI</p>
        </div>
      </div>

      <div className="sidebar-divider" />

      {/* 🔥 NAVIGATION MENU */}
      <div className="sidebar-section">
        <h3 className="sidebar-section-title">Navigation</h3>

        <div className="context-item" onClick={() => setActivePage("dashboard")} style={{cursor: "pointer"}}>
          <span className="context-value">🏠 Dashboard</span>
        </div>

        <div className="context-item" onClick={() => setActivePage("chat")} style={{cursor: "pointer"}}>
          <span className="context-value">💬 Chat</span>
        </div>

        <div className="context-item" onClick={() => setActivePage("doctors")} style={{cursor: "pointer"}}>
          <span className="context-value">🧑‍⚕️ Doctors</span>
        </div>
      </div>

      <div className="sidebar-divider" />

      {/* Patient context */}
      {patientContext ? (
        <div className="sidebar-section">
          <h3 className="sidebar-section-title">Session Context</h3>

          {patientContext.patientName && (
            <div className="context-item">
              <span className="context-label">Patient</span>
              <span className="context-value">{patientContext.patientName}</span>
            </div>
          )}

          <div className="context-item">
            <span className="context-label">Condition</span>
            <span className="context-value condition-badge">{patientContext.disease}</span>
          </div>

          {patientContext.location && (
            <div className="context-item">
              <span className="context-label">Location</span>
              <span className="context-value">📍 {patientContext.location}</span>
            </div>
          )}

          {patientContext.additionalContext && (
            <div className="context-item context-item-stack">
              <span className="context-label">Focus</span>
              <span className="context-value context-note">{patientContext.additionalContext}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="sidebar-section">
          <p className="sidebar-empty">No session active. Complete the form to start.</p>
        </div>
      )}

      <div className="sidebar-divider" />

      {/* Stats */}
      {stats && (
        <>
          <div className="sidebar-section">
            <h3 className="sidebar-section-title">Last Query Stats</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-num">{stats.publicationsPool || 0}</span>
                <span className="stat-label">Pubs Retrieved</span>
              </div>
              <div className="stat-card">
                <span className="stat-num">{stats.trialsPool || 0}</span>
                <span className="stat-label">Trials Retrieved</span>
              </div>
              <div className="stat-card">
                <span className="stat-num">{stats.totalRetrieved || 0}</span>
                <span className="stat-label">Total Pool</span>
              </div>
              <div className="stat-card">
                <span className="stat-num">
                  {stats.retrievalMs ? `${(stats.retrievalMs / 1000).toFixed(1)}s` : '—'}
                </span>
                <span className="stat-label">Retrieval</span>
              </div>
            </div>
          </div>
          <div className="sidebar-divider" />
        </>
      )}

      {/* Data sources */}
      <div className="sidebar-section">
        <h3 className="sidebar-section-title">Data Sources</h3>
        <div className="sources-list">
          <div className="source-item">
            <span className="source-dot dot-blue" />
            <div>
              <span className="source-name">PubMed</span>
              <span className="source-desc">NCBI publications</span>
            </div>
          </div>
          <div className="source-item">
            <span className="source-dot dot-teal" />
            <div>
              <span className="source-name">OpenAlex</span>
              <span className="source-desc">Open scholarly works</span>
            </div>
          </div>
          <div className="source-item">
            <span className="source-dot dot-amber" />
            <div>
              <span className="source-name">ClinicalTrials.gov</span>
              <span className="source-desc">Active & completed trials</span>
            </div>
          </div>
        </div>
      </div>

      <div className="sidebar-divider" />

      {/* Messages count */}
      {messageCount > 0 && (
        <div className="sidebar-section">
          <div className="msg-count">
            <span>💬</span>
            <span>{messageCount} message{messageCount !== 1 ? 's' : ''} in session</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="sidebar-footer">
        <button className="btn-reset" onClick={onReset}>
          ↩ New Session
        </button>

        {onLogout && (
          <button className="btn-reset" onClick={onLogout}>
            🚪 Logout
          </button>
        )}

        <p className="sidebar-credit">Powered by open-source LLMs</p>
      </div>
    </aside>
  );
}