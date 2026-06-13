import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Sparkles } from "lucide-react";
import AvatarPicker from "../components/AvatarPicker";

const API_URL = "http://127.0.0.1:8000";

export default function RegisterPage({ onRegister, onSwitchToLogin }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    avatar: "friendly",
    location: "",
    budget_style: "Budget-friendly",
    transport_preference: "Public transport",
    food_preference: "Any",
    planning_style: "Checklist-based",
  });

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const register = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      toast.error("Name, email, and password are required");
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/register`, form);

      const { access_token, user } = response.data;

      localStorage.setItem("token", access_token);
      localStorage.setItem("user", JSON.stringify(user));

      axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;

      toast.success(`Welcome, ${user.name}`);
      onRegister(user);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Could not create account");
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card register-card">
        <div className="auth-badge">
          <Sparkles size={18} />
          PocketPilot AI
        </div>

        <h1>Create profile</h1>
        <p>
          Set up your personal assistant with preferences it can remember from
          day one.
        </p>

        <div className="form-grid">
          <input
            className="auth-input"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="Name"
          />

          <input
            className="auth-input"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="Email"
            type="email"
          />

          <input
            className="auth-input"
            value={form.password}
            onChange={(e) => updateField("password", e.target.value)}
            placeholder="Password"
            type="password"
          />

          <input
            className="auth-input"
            value={form.location}
            onChange={(e) => updateField("location", e.target.value)}
            placeholder="Location, e.g. Melbourne"
          />

          <select
            className="auth-input"
            value={form.budget_style}
            onChange={(e) => updateField("budget_style", e.target.value)}
          >
            <option>Budget-friendly</option>
            <option>Balanced</option>
            <option>Premium</option>
          </select>

          <select
            className="auth-input"
            value={form.transport_preference}
            onChange={(e) =>
              updateField("transport_preference", e.target.value)
            }
          >
            <option>Public transport</option>
            <option>Walking</option>
            <option>Car</option>
            <option>Mixed</option>
          </select>

          <select
            className="auth-input"
            value={form.food_preference}
            onChange={(e) => updateField("food_preference", e.target.value)}
          >
            <option>Any</option>
            <option>Vegetarian</option>
            <option>Vegan</option>
            <option>Halal</option>
            <option>Kosher</option>
          </select>

          <select
            className="auth-input"
            value={form.planning_style}
            onChange={(e) => updateField("planning_style", e.target.value)}
          >
            <option>Checklist-based</option>
            <option>Detailed planner</option>
            <option>Flexible</option>
            <option>Minimal</option>
          </select>
        </div>

        <h3 className="avatar-title">Choose your avatar</h3>

        <AvatarPicker
          selected={form.avatar}
          onSelect={(avatar) => updateField("avatar", avatar)}
        />

        <button className="auth-button" onClick={register}>
          Create Account
        </button>

        <p className="auth-switch">
          Already have an account?{" "}
          <button onClick={onSwitchToLogin}>Sign in</button>
        </p>
      </section>
    </main>
  );
}