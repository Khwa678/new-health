import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble.jsx';
import TypingIndicator from './TypingIndicator.jsx';
import './ChatWindow.css';

export default function ChatWindow({ messages, loading, patientContext }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="chat-window">
      {/* Empty state */}
      {messages.length === 0 && !patientContext && (
        <div className="chat-empty">
          <div className="empty-icon">🔬</div>
          <h2 className="empty-title">Welcome to CuraLink</h2>
          <p className="empty-desc">
            Your AI-powered medical research companion. Complete the form to begin exploring
            peer-reviewed publications and clinical trials.
          </p>
          <div className="empty-pills">
            {[
              'Latest treatments for lung cancer',
              'Clinical trials for diabetes',
              'Deep Brain Stimulation in Parkinson\'s',
              'Recent studies on Alzheimer\'s',
            ].map((s) => (
              <span key={s} className="empty-pill">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="messages-list">
        {messages.map((msg, idx) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isLatest={idx === messages.length - 1}
          />
        ))}

        {/* Typing indicator */}
        {loading && <TypingIndicator />}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}