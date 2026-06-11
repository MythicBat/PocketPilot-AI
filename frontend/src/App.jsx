import { useEffect, useState } from "react";
import axios from "axios";
import {
  Brain,
  CalendarCheck,
  ShieldAlert,
  Database,
  Wifi,
  WifiOff,
  Sparkles,
  History,
  PlusCircle,
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
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [memories, setMemories] = useState([]);
  const [newMemory, setNewMemory] = useState("");

  const loadMemories = async () => {
    try {
      const response = await axios.get(`${API_URL}/memories`);
      setMemories(response.data);
    } catch (error) {
      console.error("Could not load memories", error);
    }
  };

  const saveMemory = async () => {
    if (!newMemory.trim()) return;

    try {
      await axios.post(`${API_URL}/memories`, {
        content: newMemory,
        category: "preference",
      });

      setNewMemory("");
      loadMemories();
    } catch (error) {
      console.error("Could not save memory", error);
    }
  };

  const loadMissions = async () => {
    try {
      const response = await axios.get(`${API_URL}/missions`);
      setMissions(response.data);
    } catch (error) {
      console.error("Could not load missions", error);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        // load memories first
        await loadMemories();

        // then load missions
        const response = await axios.get(`${API_URL}/missions`);
        if (isMounted) {
          setMissions(response.data);
        }
      } catch (error) {
        console.error("Could not load initial data", error);
      }
    };

    // run initialization asynchronously to avoid synchronous setState in effect body
    initialize();

    return () => {
      isMounted = false;
    };
  }, []);

  const startMission = async () => {
    if (!goal.trim()) return;

    setLoading(true);
    setMission(null);

    try {
      const response = await axios.post(`${API_URL}/mission`, { goal });
      setMission(response.data);
      setGoal("");
      loadMissions();
    } catch {
      setMission({
        mode: "frontend_error",
        final_answer:
          "Could not connect to backend. Make sure FastAPI is running.",
      });
    } finally {
      setLoading(false);
    }
  };

  const openSavedMission = (saved) => {
    setMission({
      mode: saved.mode,
      final_answer: saved.final_answer,
    });
  };

  return (
    <main className="layout">
      <aside className="sidebar">
        <div className="memory-panel">
          <div className="sidebar-title">
            <Database size={18} />
            <h2>Memory</h2>
          </div>

          <textarea
            className="memory-input"
            value={newMemory}
            onChange={(e) => setNewMemory(e.target.value)}
            placeholder="Save a preference."
          />

          <button className="memory-button" onClick={saveMemory}>
            <PlusCircle size={16} />
            Save Memory
          </button>

          <div className="memory-list">
            {memories.slice(0, 5).map((memory) => (
              <div key={memory.id} className="memory-item">
                <p>{memory.content}</p>
                <span>{memory.category}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar-title">
          <History size={18} />
          <h2>Mission History</h2>
        </div>

        {missions.length === 0 && (
          <p className="empty">No saved missions yet.</p>
        )}

        {missions.map((item) => (
          <button
            key={item.id}
            className="history-item"
            onClick={() => openSavedMission(item)}
          >
            <strong>{item.goal.slice(0, 60)}...</strong>
            <span>{item.mode}</span>
          </button>
        ))}
      </aside>

      <section className="app">
        <section className="hero">
          <div className="badge">
            <Sparkles size={16} />
            Qwen-powered offline-first multi-agent assistant
          </div>

          <h1>PocketPilot AI</h1>

          <p className="subtitle">
            Your personal edge assistant for planning, knowledge, memory, and
            emergency readiness.
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
                  PocketPilot switches between online reasoning and local agents.
                </p>
              </div>
            </div>

            <div className="final-card">
              <h2>Mission Plan</h2>
              <pre>{mission.final_answer}</pre>
            </div>

            {(mission.planner || mission.knowledge || mission.emergency || mission.memory) && (
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
            )}
          </section>
        )}
      </section>
    </main>
  );
}