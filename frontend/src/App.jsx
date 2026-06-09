import { useState } from "react";
import axios from "axios";
import {
  Brain,
  CalendarCheck,
  ShieldAlert,
  Database,
  Wifi,
  WifiOff,
  Sparkles,
} from "lucide-react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

function AgentCard({ icon, title, content }) {
  return (
    <div className="agent-card">
      <div className="agent-header">
        {icon}
        <h3>{title}</h3>
      </div>
      <p>{content}</p>
    </div>
  );
}

export default function App() {
  const [goal, setGoal] = useState("");
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(false);

  const startMission = async () => {
    if (!goal.trim()) return;

    setLoading(true);
    setMission(null);

    try {
      const response = await axios.post(`${API_URL}/mission`, {
        goal,
      });

      setMission(response.data);
    } catch {
      setMission({
        mode: "frontend_error",
        final_answer:
          "Could not connect to the PocketPilot backend. Make sure FastAPI is running on http://127.0.0.1:8000",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app">
      <section className="hero">
        <div className="badge">
          <Sparkles size={16} />
          Qwen-powered offline-first multi-agent assistant
        </div>

        <h1>PocketPilot AI</h1>

        <p className="subtitle">
          Your personal edge assistant for planning, knowledge, memory, and
          emergency readiness — even when the internet disappears.
        </p>

        <div className="mission-box">
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Example: I am travelling to Sydney next week and want to prepare everything offline..."
          />

          <button onClick={startMission} disabled={loading}>
            {loading ? "Agents thinking..." : "Start Mission Mode"}
          </button>
        </div>
      </section>

      {mission && (
        <section className="results">
          <div className="status-card">
            {mission.mode === "qwen_cloud" ? <Wifi /> : <WifiOff />}
            <div>
              <h2>
                Mode:{" "}
                {mission.mode === "qwen_cloud"
                  ? "Qwen Cloud"
                  : "Offline / Fallback"}
              </h2>
              <p>
                PocketPilot automatically switches between online Qwen reasoning
                and offline local agents.
              </p>
            </div>
          </div>

          <div className="final-card">
            <h2>Mission Plan</h2>
            <pre>{mission.final_answer}</pre>
          </div>

          <div className="agent-grid">
            {mission.planner && (
              <AgentCard
                icon={<CalendarCheck />}
                title="Planner Agent"
                content={mission.planner}
              />
            )}

            {mission.knowledge && (
              <AgentCard
                icon={<Brain />}
                title="Knowledge Agent"
                content={mission.knowledge}
              />
            )}

            {mission.emergency && (
              <AgentCard
                icon={<ShieldAlert />}
                title="Emergency Agent"
                content={mission.emergency}
              />
            )}

            {mission.memory && (
              <AgentCard
                icon={<Database />}
                title="Memory Agent"
                content={mission.memory}
              />
            )}
          </div>
        </section>
      )}
    </main>
  );
}