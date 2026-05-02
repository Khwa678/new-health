import { useState, useRef, useEffect } from 'react';
import './InputPanel.css';

const QUICK_PROMPTS = [
  'What are the latest treatment options?',
  'Are there any active clinical trials?',
  'What do researchers say about prognosis?',
  'What lifestyle changes are recommended?',
  'What are the side effects of common treatments?',
  'Who are the leading researchers in this field?',
];

export default function InputPanel({ onSend, loading, disabled, suggestions }) {
  const [value, setValue] = useState('');
  const [showQuick, setShowQuick] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, [value]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || loading || disabled) return;
    onSend(trimmed);
    setValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuick = (prompt) => {
    onSend(prompt);
    setShowQuick(false);
  };

  const handleSuggestion = (s) => {
    setValue(s);
    textareaRef.current?.focus();
  };

  return (
    <div className="input-panel">
      {/* AI follow-up suggestions */}
      {suggestions && suggestions.length > 0 && (
        <div className="ai-suggestions">
          <span className="suggestions-label">Suggested follow-ups:</span>
          {suggestions.slice(0, 3).map((s, i) => (
            <button
              key={i}
              className="suggestion-pill"
              onClick={() => handleSuggestion(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Quick prompts dropdown */}
      {showQuick && (
        <div className="quick-prompts">
          {QUICK_PROMPTS.map((p) => (
            <button key={p} className="quick-item" onClick={() => handleQuick(p)}>
              <span className="quick-icon">⚡</span> {p}
            </button>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="input-row">
        <button
          className="btn-quick-toggle"
          onClick={() => setShowQuick(!showQuick)}
          title="Quick prompts"
          disabled={disabled}
        >
          ⚡
        </button>

        <div className="textarea-wrapper">
          <textarea
            ref={textareaRef}
            className="chat-textarea"
            placeholder={
              disabled
                ? 'Complete the patient form to start…'
                : 'Ask about treatments, clinical trials, researchers… (Enter to send)'
            }
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || loading}
            rows={1}
          />
        </div>

        <button
          className={`btn-send ${loading ? 'loading' : ''}`}
          onClick={handleSend}
          disabled={!value.trim() || loading || disabled}
          title="Send (Enter)"
        >
          {loading ? (
            <span className="send-spinner" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>

      <p className="input-hint">
        🔍 Searches PubMed + OpenAlex + ClinicalTrials.gov in parallel · Shift+Enter for new line
      </p>
    </div>
  );
}