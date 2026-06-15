import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { useAuth } from "../context/AuthContext";
import { dashboardAPI, projectsAPI, tasksAPI } from "../services/api";
import { hasPermission } from "../utils/permissions";
import { PERMISSIONS } from "../utils/permissions";

function Dashboard() {
  const { user, permissions } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentProjects, setRecentProjects] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const canViewDashboard = hasPermission(permissions, "DASHBOARD_VIEW");

  useEffect(() => {
    if (!canViewDashboard) {
      setLoading(false);
      return;
    }

    const fetchAll = async () => {
      try {
        const [statsRes, projectsRes, tasksRes] = await Promise.all([
          dashboardAPI.getStats(),
          projectsAPI.getAll(0, 5).catch(() => ({ data: [] })),
          tasksAPI.getAll({ limit: 5 }).catch(() => ({ data: [] })),
        ]);
        setStats(statsRes.data);
        setRecentProjects(projectsRes.data?.slice(0, 5) || []);
        setRecentTasks(tasksRes.data?.slice(0, 5) || []);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [canViewDashboard]);

  if (loading) {
    return (
      <Container fluid className="page-shell">
        <div className="loading-state">Loading workspace...</div>
      </Container>
    );
  }

  if (!canViewDashboard) {
    return (
      <Container fluid className="page-shell">
        <div className="page-header">
          <div>
            <p className="page-kicker">Workspace</p>
            <h1 className="page-title">Welcome, {user?.name}</h1>
            <p className="page-description">Choose a section to continue your work.</p>
          </div>
        </div>
        <Row className="g-4">
          <Col md={4}>
            <div className="work-card card h-100">
              <div className="card-body">
                <h2 className="work-card-title">Projects</h2>
                <p className="work-card-text">View your project spaces and current delivery status.</p>
                <Button onClick={() => navigate("/projects")}>Go to Projects</Button>
              </div>
            </div>
          </Col>
          <Col md={4}>
            <div className="work-card card h-100">
              <div className="card-body">
                <h2 className="work-card-title">Tasks</h2>
                <p className="work-card-text">Track assignments, approvals, and due work.</p>
                <Button onClick={() => navigate("/tasks")}>Go to Tasks</Button>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  if (!stats) {
    return (
      <Container fluid className="page-shell">
        <div className="empty-state">Failed to load statistics</div>
      </Container>
    );
  }

  const projectMetrics = [
    { label: "Total Projects", value: stats.projects?.total ?? 0, note: "All visible projects" },
    { label: "Pending", value: stats.projects?.pending ?? 0, note: "Projects waiting to start" },
    { label: "In Progress", value: stats.projects?.in_progress ?? 0, note: "Active delivery work" },
    { label: "Completed", value: stats.projects?.completed ?? 0, note: "Completed projects" },
  ];

  const taskMetrics = [
    { label: "Total Tasks", value: stats.tasks?.total ?? 0, note: "All visible tasks" },
    { label: "Todo", value: stats.tasks?.todo ?? stats.tasks?.pending ?? 0, note: "Ready to be picked up" },
    { label: "In Progress", value: stats.tasks?.in_progress ?? 0, note: "Work currently moving" },
    { label: "Done", value: stats.tasks?.done ?? stats.tasks?.completed ?? 0, note: "Completed task items" },
  ];

  const getProjectStatusClass = (status) => {
    if (status === "COMPLETED") return "status-pill status-success";
    if (status === "IN_PROGRESS") return "status-pill status-warning";
    if (status === "DELAYED") return "status-pill status-danger";
    return "status-pill status-secondary";
  };

  const getTaskStatusClass = (status) => {
    if (status === "DONE") return "status-pill status-success";
    if (status === "IN_PROGRESS") return "status-pill status-warning";
    if (status === "BLOCKED") return "status-pill status-danger";
    return "status-pill status-secondary";
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;

  return (
    <Container fluid className="page-shell">
      <div className="page-header">
        <div>
          <p className="page-kicker">Dashboard</p>
          <h1 className="page-title">Good to see you, {user?.name} 👋</h1>
          <p className="page-description">Here's a quick overview of your projects and tasks.</p>
        </div>
        <Button onClick={() => navigate("/tasks")}>View Tasks</Button>
      </div>

      {/* Project metrics */}
      <div className="metric-grid">
        {projectMetrics.map(({ label, value, note }) => (
          <button className="metric-card text-start" key={label} onClick={() => navigate("/projects")}>
            <p className="metric-label">{label}</p>
            <div className="metric-value">{value}</div>
            <p className="metric-note">{note}</p>
          </button>
        ))}
      </div>

      {/* Task metrics */}
      <div className="metric-grid">
        {taskMetrics.map(({ label, value, note }) => (
          <button className="metric-card text-start" key={label} onClick={() => navigate("/tasks")}>
            <p className="metric-label">{label}</p>
            <div className="metric-value">{value}</div>
            <p className="metric-note">{note}</p>
          </button>
        ))}
      </div>

      {/* Overview panels */}
      <div className="dashboard-overview">
        {/* Project Overview */}
        <div className="metric-card" style={{ cursor: "default", minHeight: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <p className="metric-label" style={{ margin: 0 }}>Project Overview</p>
            <button
              onClick={() => navigate("/projects")}
              style={{ background: "none", border: "none", color: "#E8640A", fontSize: "13px", fontWeight: 700, cursor: "pointer", padding: 0 }}
            >
              View all projects →
            </button>
          </div>
          {recentProjects.length === 0 ? (
            <div style={{ color: "#aaa", fontSize: "13px", padding: "16px 0", textAlign: "center" }}>No projects yet</div>
          ) : (
            recentProjects.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}`)}
                style={{ padding: "10px 12px", borderRadius: "8px", border: "1px solid #eee8e1", marginBottom: "8px", cursor: "pointer", transition: "background 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#fff6ef")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "")}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, fontSize: "14px", color: "#1a1a1a" }}>{p.name}</span>
                  <span className={getProjectStatusClass(p.status)} style={{ fontSize: "11px" }}>
                    {p.status.replace("_", " ")}
                  </span>
                </div>
                {(p.start_date || p.end_date) && (
                  <div style={{ marginTop: "4px", fontSize: "12px", color: "#888" }}>
                    {formatDate(p.start_date)} {p.start_date && p.end_date ? "→" : ""} {formatDate(p.end_date)}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Task Overview */}
        <div className="metric-card" style={{ cursor: "default", minHeight: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <p className="metric-label" style={{ margin: 0 }}>Task Overview</p>
            <button
              onClick={() => navigate("/tasks")}
              style={{ background: "none", border: "none", color: "#E8640A", fontSize: "13px", fontWeight: 700, cursor: "pointer", padding: 0 }}
            >
              View all tasks →
            </button>
          </div>
          {recentTasks.length === 0 ? (
            <div style={{ color: "#aaa", fontSize: "13px", padding: "16px 0", textAlign: "center" }}>No tasks yet</div>
          ) : (
            recentTasks.map((t) => (
              <div
                key={t.id}
                onClick={() => navigate(`/tasks/${t.id}`)}
                style={{ padding: "10px 12px", borderRadius: "8px", border: "1px solid #eee8e1", marginBottom: "8px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "background 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#fff6ef")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "")}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: "14px", color: "#1a1a1a" }}>{t.title}</div>
                  <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>
                    {t.due_date ? `Due ${formatDate(t.due_date)}` : "No due date"}
                  </div>
                </div>
                <span className={getTaskStatusClass(t.status)} style={{ fontSize: "11px", flexShrink: 0, marginLeft: "8px" }}>
                  {t.status === "IN_PROGRESS" ? "In Progress" : t.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="metric-card" style={{ cursor: "default", minHeight: "auto" }}>
        <p className="metric-label" style={{ marginBottom: "16px" }}>Quick Actions</p>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {hasPermission(permissions, PERMISSIONS.PROJECT_CREATE) && (
            <button
              onClick={() => navigate("/projects")}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "16px 28px", border: "1px solid #eee8e1", borderRadius: "12px", background: "#fffefa", cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#fff6ef"; e.currentTarget.style.borderColor = "#E8640A"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#fffefa"; e.currentTarget.style.borderColor = "#eee8e1"; }}
            >
              <span style={{ fontSize: "26px" }}>📁</span>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#333" }}>Create Project</span>
            </button>
          )}
          {hasPermission(permissions, PERMISSIONS.TASK_CREATE) && (
            <button
              onClick={() => navigate("/tasks")}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "16px 28px", border: "1px solid #eee8e1", borderRadius: "12px", background: "#fffefa", cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#fff6ef"; e.currentTarget.style.borderColor = "#E8640A"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#fffefa"; e.currentTarget.style.borderColor = "#eee8e1"; }}
            >
              <span style={{ fontSize: "26px" }}>✅</span>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#333" }}>Add Task</span>
            </button>
          )}
          {hasPermission(permissions, PERMISSIONS.USER_VIEW_ALL) && (
            <button
              onClick={() => navigate("/users")}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "16px 28px", border: "1px solid #eee8e1", borderRadius: "12px", background: "#fffefa", cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#fff6ef"; e.currentTarget.style.borderColor = "#E8640A"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#fffefa"; e.currentTarget.style.borderColor = "#eee8e1"; }}
            >
              <span style={{ fontSize: "26px" }}>👥</span>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#333" }}>Manage Users</span>
            </button>
          )}
        </div>
      </div>
    </Container>
  );
}

export default Dashboard;
