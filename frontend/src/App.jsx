import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
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
  User,
  Target,
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
  const [simGoal, setSimGoal] = useState("");
  const [simTimeframe, setSimTimeframe] = useState("3 months");
  const [simulation, setSimulation] = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  const [profile, setProfile] = useState({
    name: "",
    budget_style: "",
    transport_preference: "",
    food_preference: "",
    planning_style: "",
    location: "",
  });

  const runGoalSimulation = async () => {
    if (!simGoal.trim()) return;

    setSimLoading(true);
    setSimulation(null);

    try {
      const response = await axios.post(`${API_URL}/simulate-goal`, {
        goal: simGoal,
        timeframe: simTimeframe,
      });

      setSimulation(response.data);
    } catch {
      setSimulation({
        mode: "frontend_error",
        simulation: "Could not run Goal Simulation.",
      });
    } finally {
      setSimLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/profile`);
      setProfile(response.data);
    } catch (error) {
      console.error("Could not load profile", error);
    }
  };

  const saveProfile = async () => {
    try {
      await axios.post(`${API_URL}/profile`, profile);
      await loadProfile();
      toast.success("Profile saved");
    } catch (error) {
      console.error("Could not save profile", error);
      toast.error("Could not save profile");
    }
  };

  const updateProfileField = (field, value) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

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
    if (!file) {
      toast.error("No file selected");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      toast.loading("Uploading Knowledge...", {id: "upload"});

      await axios.post(`${API_URL}/knowledge/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      await loadKnowledge();
      toast.success("Knowledge Uploaded.", {id: "upload"});
    } catch (error) {
      console.error("Could not upload knowledge", error);
      toast.error("Upload failed", {id: "upload"});
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
    if (!newMemory.trim()) {
      toast.error("Memory cannot be saved");
      return;
    }

    try {
      await axios.post(`${API_URL}/memories`, {
        content: newMemory,
        category: "preference",
      });

      setNewMemory("");
      await loadMemories();
      toast.success("Memory saved");
    } catch (error) {
      console.error("Could not save memory", error);
      toast.error("Could not save memory");
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
        await loadProfile();

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
        toast.success("Mission generated");
      }, 500);
    } catch {
      clearInterval(interval);
      setMission({
        mode: "frontend_error",
        final_answer:
          "Could not connect to backend. Make sure FastAPI is running.",
      });
      toast.error("Mission failed");
    } finally {
      setLoading(false);
    }
  };

  const openSavedMission = (saved) => {
    setMission({
      mission_id: saved.id,
      mode: saved.mode,
      final_answer: saved.final_answer,
    });
  };

  const exportMission = () => {
    if (!mission?.mission_id) return;
    window.open(`${API_URL}/missions/${mission.mission_id}/export`, "_blank");
  };

  return (
  <main className="layout">
    <Toaster position="top-right" />
    <aside className="sidebar">
      <div className="brand-card">
        <Sparkles size={32} />
        <div>
          <h1>
            PocketPilot <span>AI</span>
          </h1>
          <p>Your personal edge assistant</p>
        </div>
      </div>

      <div className="profile-panel card">
        <div className="sidebar-title">
          <User size={18} />
          <h2>User Profile</h2>
        </div>

        <input className="profile-input" value={profile.name} onChange={(e) => updateProfileField("name", e.target.value)} placeholder="Enter your name" />
        <input className="profile-input" value={profile.location} onChange={(e) => updateProfileField("location", e.target.value)} placeholder="Enter your location" />
        <input className="profile-input" value={profile.budget_style} onChange={(e) => updateProfileField("budget_style", e.target.value)} placeholder="e.g. Budget-friendly" />
        <input className="profile-input" value={profile.transport_preference} onChange={(e) => updateProfileField("transport_preference", e.target.value)} placeholder="e.g. Public transport" />
        <input className="profile-input" value={profile.food_preference} onChange={(e) => updateProfileField("food_preference", e.target.value)} placeholder="e.g. Vegetarian" />
        <input className="profile-input" value={profile.planning_style} onChange={(e) => updateProfileField("planning_style", e.target.value)} placeholder="e.g. Checklist-based" />

        <button className="memory-button" onClick={saveProfile}>
          <Download size={16} />
          Save Profile
        </button>
      </div>

      <div className="simulator-card card">
        <div className="sidebar-title">
          <Target size={18} />
          <h2>Goal Simulator</h2>
        </div>

        <p className="simulator-subtitle">
          Simulate a realistic path from where you are now to where you want to be.
        </p>

        <textarea
          value={simGoal}
          onChange={(e) => setSimGoal(e.target.value)}
          placeholder="Describe your goal..."
        />

        <input
          className="profile-input"
          value={simTimeframe}
          onChange={(e) => setSimTimeframe(e.target.value)}
          placeholder="Timeframe..."
        />

        <button onClick={runGoalSimulation} disabled={simLoading}>
          <Route size={16} />
          {simLoading ? "Simulating..." : "Run Goal Simulation"}
        </button>
      </div>
    </aside>

    <section className="main-content">
      <section className="dashboard-card">
        <div className="section-heading">
          <Database size={20} />
          <h2>Memory</h2>
        </div>

        <p className="section-description">
          Save preferences, important notes, or anything you want PocketPilot to remember.
        </p>

        <textarea
          className="memory-input"
          value={newMemory}
          onChange={(e) => setNewMemory(e.target.value)}
          placeholder="Save a preference..."
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
      </section>

      <section className="dashboard-card">
        <div className="section-heading">
          <Brain size={20} />
          <h2>Knowledge Vault</h2>
        </div>

        <p className="section-description">
          Upload notes, documents, PDFs to build your personal knowledge base.
        </p>

        <label className="upload-box">
          <Upload size={34} />
          <strong>Upload note/file</strong>
          <span>PDF, DOCX, TXT up to 20MB</span>
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
      </section>

      <section className="dashboard-card">
        <div className="section-heading">
          <History size={20} />
          <h2>Mission History</h2>
        </div>

        {missions.length === 0 ? (
          <div className="empty-state">
            <History size={54} />
            <h3>No saved missions yet.</h3>
            <p>Start your first mission, and it will appear here.</p>
          </div>
        ) : (
          missions.map((item) => (
            <button
              key={item.id}
              className="history-item"
              onClick={() => openSavedMission(item)}
            >
              <strong>{item.goal.slice(0, 60)}...</strong>
              <span>{item.mode}</span>
            </button>
          ))
        )}
      </section>

      <section className="dashboard-card">
        <div className="section-heading">
          <Sparkles size={20} />
          <h2>Mission Mode</h2>
        </div>

        <p className="section-description">
          Ask PocketPilot to plan a mission using your profile, memory, knowledge, and agents.
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

      {workflowVisible && (
        <section className="workflow-card">
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
        </section>
      )}

      {simulation && (
        <section className="simulation-result">
          <h2>
            Simulation Mode:{" "}
            {simulation.mode === "qwen_cloud"
              ? "Qwen Cloud"
              : simulation.mode === "ollama_offline"
              ? "Local Ollama"
              : "Offline Fallback"}
          </h2>

          <div className="markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {simulation.simulation}
            </ReactMarkdown>
          </div>
        </section>
      )}

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
              <p>PocketPilot switches between online reasoning and local agents.</p>
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

            <div className="markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {mission.final_answer}
              </ReactMarkdown>
            </div>
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
