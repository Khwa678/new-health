import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

import Sidebar from "./components/Sidebar.jsx";
import ChatWindow from "./components/ChatWindow.jsx";
import InputPanel from "./components/InputPanel.jsx";
import OnboardingModal from "./components/OnboardingModal.jsx";

import Login from "./Pages/Login.jsx";
import Register from "./Pages/Register.jsx";
import Dashboard from "./Pages/Dashboard.jsx";
import Doctors from "./Pages/Doctors.jsx";

import "./App.css";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";

export default function App() {
  const [sessionId] = useState(() => uuidv4());
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [patientContext, setPatientContext] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [stats, setStats] = useState(null);
  const [activePage, setActivePage] = useState("dashboard");

  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const [authPage, setAuthPage] = useState("login");

  const handleLogin = (data) => {
    localStorage.setItem("user", JSON.stringify(data));
    setUser(data);
  };

  const handleRegister = (data) => {
    localStorage.setItem("user", JSON.stringify(data));
    setUser(data);
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
  };

  const handleContextSubmit = useCallback((context) => {
    setPatientContext(context);
    setShowOnboarding(false);

    setMessages([
      {
        id: uuidv4(),
        role: "assistant",
        content: `Hello ${context.patientName || ""}! I'll help you explore research on **${context.disease}**. Ask me anything — symptoms, treatments, recent studies, or clinical trials.`,
      },
    ]);
  }, []);

  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim() || loading) return;

      const userMsg = { id: uuidv4(), role: "user", content: text };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      try {
        // Build conversation history
        const history = messages.map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        }));

        const systemPrompt = `You are CuraLink, an AI medical research assistant.
The patient's name is ${patientContext?.patientName || "the user"} and they are researching: ${patientContext?.disease || "a medical condition"}.
Provide clear, empathetic, evidence-based research insights.
Focus on: current treatments, ongoing clinical trials, recent studies, and lifestyle recommendations.
Always remind users to consult their doctor for personal medical decisions.`;

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
           model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: systemPrompt },
              ...history,
              { role: "user", content: text },
            ],
            max_tokens: 1024,
            temperature: 0.7,
          }),
        });

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error.message);
        }

        const reply = data?.choices?.[0]?.message?.content || "Sorry, no response received.";

        setMessages((prev) => [
          ...prev,
          { id: uuidv4(), role: "assistant", content: reply },
        ]);

        // Update stats
        setStats((prev) => ({
          totalQueries: (prev?.totalQueries || 0) + 1,
          papersFound: Math.floor(Math.random() * 20) + 5,
          lastQuery: text.slice(0, 40),
        }));

      } catch (err) {
        console.error("Groq API Error:", err);
        setMessages((prev) => [
          ...prev,
          {
            id: uuidv4(),
            role: "assistant",
            content: `⚠️ Error: ${err.message || "Something went wrong. Check your VITE_GROQ_API_KEY in .env"}`,
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, patientContext]
  );

  const handleReset = () => {
    setMessages([]);
    setPatientContext(null);
    setShowOnboarding(true);
    setStats(null);
  };

  if (!user) {
    return authPage === "login" ? (
      <Login onLogin={handleLogin} goToRegister={() => setAuthPage("register")} />
    ) : (
      <Register onRegister={handleRegister} goToLogin={() => setAuthPage("login")} />
    );
  }

  return (
    <div className="app-layout">
      <Sidebar
        patientContext={patientContext}
        stats={stats}
        messageCount={messages.length}
        onReset={handleReset}
        onLogout={logout}
        setActivePage={setActivePage}
      />

      <main className="app-main">
        {activePage === "dashboard" && (
          <Dashboard patientContext={patientContext} messageCount={messages.length} stats={stats} />
        )}

        {activePage === "chat" && (
          <>
            {showOnboarding && <OnboardingModal onSubmit={handleContextSubmit} />}
            <ChatWindow messages={messages} loading={loading} />
            {!showOnboarding && <InputPanel onSend={sendMessage} loading={loading} />}
          </>
        )}

        {activePage === "doctors" && <Doctors />}
      </main>
    </div>
  );
}