import { useState } from 'react';
import './PublicationCard.css';

const SOURCE_COLORS = {
  PubMed: 'badge-blue',
  OpenAlex: 'badge-teal',
};

export default function PublicationCard({ pub, index }) {
  const [expanded, setExpanded] = useState(false);

  const abstract = pub.abstract || '';
  const shortAbstract = abstract.length > 220 ? abstract.substring(0, 220) + '…' : abstract;

  return (
    <div className="pub-card">
      {/* Top row: index + source badge */}
      <div className="pub-card-top">
        <span className="pub-index">PUB{index}</span>
        <span className={`badge ${SOURCE_COLORS[pub.source] || 'badge-gray'}`}>
          {pub.source}
        </span>
        {pub.isOpenAccess && (
          <span className="badge badge-green" title="Open Access">🔓 OA</span>
        )}
        {pub.year && <span className="pub-year">{pub.year}</span>}
        {pub.citationCount > 0 && (
          <span className="pub-citations" title="Citation count">
            📊 {pub.citationCount.toLocaleString()} citations
          </span>
        )}
      </div>

      {/* Title */}
      <h5 className="pub-title">
        {pub.url ? (
          <a href={pub.url} target="_blank" rel="noopener noreferrer">
            {pub.title}
          </a>
        ) : (
          pub.title
        )}
      </h5>

      {/* Authors */}
      {pub.authors && (
        <p className="pub-authors">
          <span className="pub-authors-label">Authors:</span> {pub.authors}
          {pub.authors.endsWith(', ') || pub.authors.split(',').length >= 3 ? ' et al.' : ''}
        </p>
      )}

      {/* Journal */}
      {pub.journal && (
        <p className="pub-journal">📰 {pub.journal}</p>
      )}

      {/* Abstract */}
      {abstract && (
        <div className="pub-abstract">
          <p className="abstract-text">
            {expanded ? abstract : shortAbstract}
          </p>
          {abstract.length > 220 && (
            <button
              className="expand-btn"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? '▲ Show less' : '▼ Read more'}
            </button>
          )}
        </div>
      )}

      {/* Footer link */}
      {pub.url && (
        <div className="pub-card-footer">
          <a href={pub.url} target="_blank" rel="noopener noreferrer" className="pub-link">
            View Publication →
          </a>
        </div>
      )}
    </div>
  );
}