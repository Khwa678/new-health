import { useState } from "react";
import "../style/App.css";

export default function Register({ onRegister, goToLogin }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    // Check if email already registered
    const existingUsers = JSON.parse(localStorage.getItem("users") || "[]");
    const alreadyExists = existingUsers.find((u) => u.email === form.email);

    if (alreadyExists) {
      setError("An account with this email already exists.");
      return;
    }

    // Create new user
    const newUser = {
      id: Date.now(),
      name: form.name,
      email: form.email,
      password: form.password, // plaintext — fine for frontend-only mock
    };

    // Save to users list
    existingUsers.push(newUser);
    localStorage.setItem("users", JSON.stringify(existingUsers));

    // Save session
    const sessionUser = { id: newUser.id, name: newUser.name, email: newUser.email };
    localStorage.setItem("user", JSON.stringify(sessionUser));
    localStorage.setItem("token", `mock-token-${newUser.id}`);

    onRegister(sessionUser);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create Account</h2>
        <p className="subtitle">Join CuraLink</p>

        {error && <p style={{ color: "red", fontSize: "14px" }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <input type="text" name="name" placeholder="Full Name" onChange={handleChange} required />
          <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
          <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
          <button type="submit">Register →</button>
        </form>

        <p className="switch">
          Already have an account?{" "}
          <span onClick={goToLogin}>Login</span>
        </p>
      </div>
    </div>
  );
}