import './TypingIndicator.css';

export default function TypingIndicator() {
  return (
    <div className="typing-wrapper animate-fade-in">
      <div className="typing-avatar">🔬</div>
      <div className="typing-bubble">
        <div className="typing-header">
          <span className="typing-label">CuraLink is researching</span>
          <span className="typing-steps">Retrieving → Ranking → Reasoning</span>
        </div>
        <div className="typing-dots">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
        </div>
      </div>
    </div>
  );
}