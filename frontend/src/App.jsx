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
  Upload,
  Route,
  CheckCircle2,
  Loader2,
  Download,
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

function WorkflowStep({ icon, title, status }) {
  return (
    <div className={`workflow-step ${status}`}>
      <div className="workflow-icon">
        {status === "running" ? (
          <Loader2 className="spin" size={20} />
        ) : status === "done" ? (
          <CheckCircle2 size={20} />
        ) : (
          icon
        )}
      </div>

      <div>
        <strong>{title}</strong>
        <span>
          {status === "done"
            ? "Completed"
            : status === "running"
            ? "Running..."
            : "Waiting"}
        </span>
      </div>
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
  const [knowledge, setKnowledge] = useState([]);

  const baseWorkflow = [
    {
      "id": "planner",
      "title": "Planner Agent",
      icon: <CalendarCheck size={20} />
    },

    {
      "id": "knowledge",
      "title": "Knowledge Agent",
      icon: <Brain size={20} />
    },

    {
      "id": "memory",
      "title": "Memory Agent",
      icon: <Database size={20} />
    },

    {
      "id": "emergency",
      "title": "Emergency Agent",
      icon: <ShieldAlert size={20} />
    },

    {
      "id": "qwen",
      "title": "Qwen Reasoning Agent",
      icon: <Sparkles size={20} />
    },

    {
      "id": "final",
      "title": "Final Mission Plan",
      icon: <Route size={20} />
    },
  ];

  const [activeStep, setActiveStep] = useState(-1);
  const [workflowVisible, setWorkflowVisible] = useState(false);

  const getStepStatus = (index) => {
    if (!workflowVisible) return "waiting";
    if (index < activeStep) return "done";
    if (index === activeStep) return "running";
    return "waiting";
  };

  const loadKnowledge = async () => {
    try {
      const response = await axios.get(`${API_URL}/knowledge`);
      setKnowledge(response.data);
    } catch (error) {
      console.error("Could not load knowledge", error);
    }
  };

  const uploadKnowledge = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post(`${API_URL}/knowledge/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      loadKnowledge();
    } catch (error) {
      console.error("Could not upload knowledge", error);
    }
  };

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
        // load knowledge first
        await loadKnowledge();

        // load memories
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
    setWorkflowVisible(true);
    setActiveStep(0);

    const interval = setInterval(() => {
      setActiveStep((prev) => {
        if (prev < baseWorkflow.length - 2) {
          return prev + 1;
        }
        return prev;
      });
    }, 700);

    try {
      const response = await axios.post(`${API_URL}/mission`, { goal });

      clearInterval(interval);
      setActiveStep(baseWorkflow.length - 1);

      setTimeout(() => {
        setMission(response.data);
        setActiveStep(baseWorkflow.length);
        setGoal("");
        loadMissions();
        loadMemories();
        loadKnowledge();
      }, 500);
    } catch {
      clearInterval(interval);
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
      misson_id: saved.id,
      mode: saved.mode,
      final_answer: saved.final_answer,
    });
  };

  const exportMission = () => {
    if (!mission?.misson_id) return;
    window.open(`${API_URL}/missions/${mission.misson_id}/export`, "_blank");
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

        <div className="knowledge-panel">
          <div className="sidebar-title">
            <Brain size={18} />
            <h2>Knowledge Vault</h2>
          </div>

          <label className="upload-box">
            <Upload size={18} />
            Upload note/file
            <input
              type="file"
              accept=".txt, .md, .csv, .pdf, .docx"
              onChange={uploadKnowledge}
              hidden
            />
          </label>

          <div className="memory-list">
            {knowledge.slice(0, 5).map((item) => (
              <div key={item.id} className="memory-item">
                <p>{item.title}</p>
                <span>{item.source}</span>
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

          {workflowVisible && (
            <div className="workflow-card">
              <div className="workflow-title">
                <Route size={20} />
                <h2>Agent Workflow</h2>
              </div>

              <div className="workflow-list">
                {baseWorkflow.map((step, index) => (
                  <WorkflowStep
                    key={step.id}
                    icon={step.icon}
                    title={step.title}
                    status={getStepStatus(index)}
                  />
                ))}
              </div>
            </div>
          )}
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
                    : mission.mode === "ollama_offline"
                    ? "Local Ollama"
                    : "Offline / Fallback"}
                </h2>
                <p>
                  PocketPilot switches between online reasoning and local agents.
                </p>
              </div>
            </div>

            <div className="final-card">
              <h2>Mission Plan</h2>
              {mission.mission_id && (
                <button className="export-button" onClick={exportMission}>
                  <Download size={16} />
                  Export PDF
                </button>
              )}
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