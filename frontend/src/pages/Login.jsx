import { useState } from "react";
import "../styles/auth.css";

export default function Login({ onLogin, goToRegister }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    // Look up user from localStorage
    const existingUsers = JSON.parse(localStorage.getItem("users") || "[]");
    const matched = existingUsers.find(
      (u) => u.email === form.email && u.password === form.password
    );

    if (!matched) {
      setError("Invalid email or password.");
      return;
    }

    // Save session
    const sessionUser = { id: matched.id, name: matched.name, email: matched.email };
    localStorage.setItem("user", JSON.stringify(sessionUser));
    localStorage.setItem("token", `mock-token-${matched.id}`);

    onLogin(sessionUser);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>CuraLink</h2>
        <p className="subtitle">AI Medical Research Assistant</p>

        {error && <p style={{ color: "red", fontSize: "14px" }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <input type="email" name="email" placeholder="Enter your email" onChange={handleChange} required />
          <input type="password" name="password" placeholder="Enter your password" onChange={handleChange} required />
          <button type="submit">Login →</button>
        </form>

        <p className="switch">
          Don't have an account?{" "}
          <span onClick={goToRegister}>Register</span>
        </p>
      </div>
    </div>
  );
}