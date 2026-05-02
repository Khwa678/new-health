import { useState } from 'react';
import './TrialCard.css';

const STATUS_MAP = {
  RECRUITING: { label: 'Recruiting', cls: 'badge-green', dot: '#1a7a3a' },
  COMPLETED: { label: 'Completed', cls: 'badge-blue', dot: '#1a6bcc' },
  ACTIVE_NOT_RECRUITING: { label: 'Active', cls: 'badge-amber', dot: '#c77b00' },
  NOT_YET_RECRUITING: { label: 'Not Yet Recruiting', cls: 'badge-purple', dot: '#5e35b1' },
  SUSPENDED: { label: 'Suspended', cls: 'badge-red', dot: '#c0392b' },
  TERMINATED: { label: 'Terminated', cls: 'badge-red', dot: '#c0392b' },
  WITHDRAWN: { label: 'Withdrawn', cls: 'badge-gray', dot: '#94a3b8' },
};

export default function TrialCard({ trial, index }) {
  const [expanded, setExpanded] = useState(false);

  const statusInfo = STATUS_MAP[trial.status] || { label: trial.status || 'Unknown', cls: 'badge-gray' };
  const summary = trial.summary || '';
  const shortSummary = summary.length > 200 ? summary.substring(0, 200) + '…' : summary;

  return (
    <div className="trial-card">
      {/* Top row */}
      <div className="trial-card-top">
        <span className="trial-index">TRIAL{index}</span>
        <span className={`badge ${statusInfo.cls}`}>
          <span
            className="status-dot"
            style={{ background: statusInfo.dot }}
          />
          {statusInfo.label}
        </span>
        {trial.phase && trial.phase !== 'N/A' && (
          <span className="badge badge-purple">Phase {trial.phase}</span>
        )}
        {trial.id && (
          <span className="trial-nct">{trial.id}</span>
        )}
      </div>

      {/* Title */}
      <h5 className="trial-title">
        {trial.url ? (
          <a href={trial.url} target="_blank" rel="noopener noreferrer">
            {trial.title}
          </a>
        ) : trial.title}
      </h5>

      {/* Meta grid */}
      <div className="trial-meta-grid">
        {trial.studyType && trial.studyType !== 'N/A' && (
          <div className="meta-item">
            <span className="meta-label">Study Type</span>
            <span className="meta-value">{trial.studyType}</span>
          </div>
        )}
        {trial.sponsor && trial.sponsor !== 'N/A' && (
          <div className="meta-item">
            <span className="meta-label">Sponsor</span>
            <span className="meta-value">{trial.sponsor}</span>
          </div>
        )}
        {trial.enrollment && trial.enrollment !== 'N/A' && (
          <div className="meta-item">
            <span className="meta-label">Enrollment</span>
            <span className="meta-value">{trial.enrollment} participants</span>
          </div>
        )}
        {trial.startDate && trial.startDate !== 'N/A' && (
          <div className="meta-item">
            <span className="meta-label">Start Date</span>
            <span className="meta-value">{trial.startDate}</span>
          </div>
        )}
        {trial.completionDate && trial.completionDate !== 'N/A' && (
          <div className="meta-item">
            <span className="meta-label">Completion</span>
            <span className="meta-value">{trial.completionDate}</span>
          </div>
        )}
        {trial.gender && (
          <div className="meta-item">
            <span className="meta-label">Gender</span>
            <span className="meta-value">{trial.gender}</span>
          </div>
        )}
        {(trial.minAge || trial.maxAge) && trial.minAge !== 'N/A' && (
          <div className="meta-item">
            <span className="meta-label">Age Range</span>
            <span className="meta-value">{trial.minAge} – {trial.maxAge}</span>
          </div>
        )}
      </div>

      {/* Location */}
      {trial.locations && trial.locations !== 'Multiple / Not specified' && (
        <div className="trial-location">
          <span className="meta-label">📍 Location:</span>
          <span className="location-text">{trial.locations}</span>
        </div>
      )}

      {/* Interventions */}
      {trial.interventions && trial.interventions !== 'N/A' && (
        <div className="trial-interventions">
          <span className="meta-label">💊 Interventions:</span>
          <span className="location-text">{trial.interventions}</span>
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div className="trial-summary">
          <p className="summary-text">
            {expanded ? summary : shortSummary}
          </p>
          {summary.length > 200 && (
            <button className="expand-btn" onClick={() => setExpanded(!expanded)}>
              {expanded ? '▲ Show less' : '▼ Read more'}
            </button>
          )}
        </div>
      )}

      {/* Eligibility snippet */}
      {trial.eligibility && expanded && (
        <div className="trial-eligibility">
          <p className="meta-label">Eligibility Criteria:</p>
          <p className="eligibility-text">
            {trial.eligibility.substring(0, 500)}
            {trial.eligibility.length > 500 ? '…' : ''}
          </p>
        </div>
      )}

      {/* Contact + Link */}
      <div className="trial-card-footer">
        {trial.contact?.name && trial.contact.name !== 'See trial page' && (
          <div className="contact-info">
            <span className="contact-name">👤 {trial.contact.name}</span>
            {trial.contact.phone && (
              <a href={`tel:${trial.contact.phone}`} className="contact-link">
                📞 {trial.contact.phone}
              </a>
            )}
            {trial.contact.email && (
              <a href={`mailto:${trial.contact.email}`} className="contact-link">
                ✉️ {trial.contact.email}
              </a>
            )}
          </div>
        )}
        {trial.url && (
          <a href={trial.url} target="_blank" rel="noopener noreferrer" className="trial-link">
            View on ClinicalTrials.gov →
          </a>
        )}
      </div>
    </div>
  );
}