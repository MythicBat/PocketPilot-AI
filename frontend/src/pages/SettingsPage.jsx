import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { ArrowLeft, Save } from "lucide-react";
import AvatarPicker from "../components/AvatarPicker";

const API_URL = "http://127.0.0.1:8000";

export default function SettingsPage({ user, onBack, onUserUpdated }) {
  const [form, setForm] = useState({
    name: user.name || "",
    avatar: user.avatar || "friendly",
    location: user.location || "",
    budget_style: user.budget_style || "Budget-friendly",
    transport_preference: user.transport_preference || "Public transport",
    food_preference: user.food_preference || "Any",
    planning_style: user.planning_style || "Checklist-based",
  });

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveSettings = async () => {
    try {
      const response = await axios.put(`${API_URL}/me`, form);
      const updatedUser = response.data.user;

      localStorage.setItem("user", JSON.stringify(updatedUser));

      toast.success("Settings updated");
      onUserUpdated(updatedUser);
    } catch (error) {
      console.error(error);
      toast.error("Could not update settings");
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card register-card">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <h1>Settings</h1>
        <p>Update your profile and assistant preferences.</p>

        <div className="form-grid">
          <input
            className="auth-input"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="Name"
          />

          <input
            className="auth-input"
            value={form.location}
            onChange={(e) => updateField("location", e.target.value)}
            placeholder="Location"
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
            onChange={(e) => updateField("transport_preference", e.target.value)}
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

        <h3 className="avatar-title">Avatar</h3>

        <AvatarPicker
          selected={form.avatar}
          onSelect={(avatar) => updateField("avatar", avatar)}
        />

        <button className="auth-button" onClick={saveSettings}>
          <Save size={16} />
          Save Settings
        </button>
      </section>
    </main>
  );
}