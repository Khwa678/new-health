import { useState } from 'react';
import PublicationCard from './PublicationCard.jsx';
import TrialCard from './TrialCard.jsx';
import './MessageBubble.css';

export default function MessageBubble({ message, isLatest }) {
  const [activeTab, setActiveTab] = useState('insights');

  const isUser = message.role === 'user';
  const isError = message.role === 'error';
  const isAssistant = message.role === 'assistant';

  const llm = message.llm || null;
  const pubs = message.publications || [];
  const trials = message.trials || [];
  const hasResearch = pubs.length > 0 || trials.length > 0;

  const renderText = (text) => {
    if (!text) return null;
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^### (.*$)/gm, '<h4 style="color:#4a9eff;margin:8px 0 4px">$1</h4>')
      .replace(/^## (.*$)/gm, '<h3 style="color:#4a9eff;margin:10px 0 4px">$1</h3>')
      .replace(/^# (.*$)/gm, '<h2 style="color:#4a9eff;margin:12px 0 4px">$1</h2>')
      .replace(/^\* (.*$)/gm, '<li style="margin:4px 0">$1</li>')
      .replace(/^- (.*$)/gm, '<li style="margin:4px 0">$1</li>')
      .replace(/(<li.*<\/li>)/gs, '<ul style="padding-left:20px;margin:8px 0">$1</ul>')
      .replace(/\[PUB(\d+)\]/g, '<span class="cite-ref">PUB$1</span>')
      .replace(/\[TRIAL(\d+)\]/g, '<span class="cite-ref trial-ref">TRIAL$1</span>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className={`message-wrapper ${isUser ? 'user-wrapper' : 'assistant-wrapper'} animate-fade-in`}>

      {/* User bubble */}
      {isUser && (
        <div className="user-bubble">
          <p className="user-text">{message.content}</p>
          <span className="msg-time">{formatTime(message.timestamp)}</span>
        </div>
      )}

      {/* Error bubble */}
      {isError && (
        <div className="error-bubble">
          <span className="error-icon">⚠️</span>
          <p>{message.content}</p>
        </div>
      )}

      {/* Plain assistant message (Groq response) */}
      {isAssistant && !llm && (
        <div className="assistant-card welcome-card">
          <div className="assistant-avatar">🔬</div>
          <div className="assistant-body">
            <div
              className="assistant-plain-text"
              style={{ lineHeight: "1.8", fontSize: "14px", color: "#e0e0e0" }}
              dangerouslySetInnerHTML={{ __html: renderText(message.content) }}
            />
            <span className="msg-time">{formatTime(message.timestamp)}</span>
          </div>
        </div>
      )}

      {/* Full LLM response (old backend - kept for compatibility) */}
      {isAssistant && llm && (
        <div className="assistant-card full-response">
          <div className="assistant-avatar">🔬</div>
          <div className="assistant-body full-width">

            {llm.conditionOverview && (
              <div className="response-section overview-section">
                <div className="section-header">
                  <span className="section-icon">🩺</span>
                  <h4 className="section-title">Condition Overview</h4>
                </div>
                <p
                  className="section-text"
                  dangerouslySetInnerHTML={{ __html: renderText(llm.conditionOverview) }}
                />
              </div>
            )}

            {llm.researchInsights && (
              <div className="response-section insights-section">
                <div className="section-header">
                  <span className="section-icon">📊</span>
                  <h4 className="section-title">Research Insights</h4>
                  {pubs.length > 0 && (
                    <span className="badge badge-blue">{pubs.length} publications</span>
                  )}
                </div>
                <p
                  className="section-text"
                  dangerouslySetInnerHTML={{ __html: renderText(llm.researchInsights) }}
                />
              </div>
            )}

            {llm.clinicalTrialsInsight && (
              <div className="response-section trials-insight-section">
                <div className="section-header">
                  <span className="section-icon">🧪</span>
                  <h4 className="section-title">Clinical Trials</h4>
                  {trials.length > 0 && (
                    <span className="badge badge-amber">{trials.length} trials</span>
                  )}
                </div>
                <p
                  className="section-text"
                  dangerouslySetInnerHTML={{ __html: renderText(llm.clinicalTrialsInsight) }}
                />
              </div>
            )}

            {llm.keyTakeaway && (
              <div className="response-section takeaway-section">
                <div className="section-header">
                  <span className="section-icon">💡</span>
                  <h4 className="section-title">Key Takeaway</h4>
                </div>
                <p
                  className="section-text takeaway-text"
                  dangerouslySetInnerHTML={{ __html: renderText(llm.keyTakeaway) }}
                />
              </div>
            )}

            {hasResearch && (
              <div className="source-tabs-container">
                <div className="tab-header">
                  <button
                    className={`tab-btn ${activeTab === 'insights' ? 'active' : ''}`}
                    onClick={() => setActiveTab('insights')}
                  >
                    📄 Publications ({pubs.length})
                  </button>
                  {trials.length > 0 && (
                    <button
                      className={`tab-btn ${activeTab === 'trials' ? 'active' : ''}`}
                      onClick={() => setActiveTab('trials')}
                    >
                      🧪 Clinical Trials ({trials.length})
                    </button>
                  )}
                </div>
                <div className="tab-content">
                  {activeTab === 'insights' && (
                    <div className="cards-grid">
                      {pubs.map((pub, i) => (
                        <PublicationCard key={pub.id || i} pub={pub} index={i + 1} />
                      ))}
                    </div>
                  )}
                  {activeTab === 'trials' && (
                    <div className="cards-grid">
                      {trials.map((trial, i) => (
                        <TrialCard key={trial.id || i} trial={trial} index={i + 1} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {llm.followUpSuggestions?.length > 0 && (
              <div className="followup-section">
                <p className="followup-label">You might also ask:</p>
                <div className="followup-pills">
                  {llm.followUpSuggestions.map((s, i) => (
                    <span key={i} className="followup-pill">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {llm.disclaimer && (
              <p className="disclaimer-text">⚕️ {llm.disclaimer}</p>
            )}

            <span className="msg-time">{formatTime(message.timestamp)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}