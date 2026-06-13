import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Sparkles } from "lucide-react";

const API_URL = "http://127.0.0.1:8000";

export default function LoginPage({ onLogin, onSwitchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error("Enter email and password");
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/login`, {
        email,
        password,
      });

      const { access_token, user } = response.data;

      localStorage.setItem("token", access_token);
      localStorage.setItem("user", JSON.stringify(user));

      axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;

      toast.success(`Welcome back, ${user.name}`);
      onLogin(user);
    } catch {
      toast.error("Invalid email or password");
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-badge">
          <Sparkles size={18} />
          PocketPilot AI
        </div>

        <h1>Welcome back</h1>
        <p>Your offline-first personal AI assistant is ready.</p>

        <input
          className="auth-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
        />

        <input
          className="auth-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
        />

        <button className="auth-button" onClick={login}>
          Sign In
        </button>

        <p className="auth-switch">
          New here?{" "}
          <button onClick={onSwitchToRegister}>Create account</button>
        </p>
      </section>
    </main>
  );
}