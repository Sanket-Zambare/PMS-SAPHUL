import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { useAuth } from "../context/AuthContext";
import { dashboardAPI } from "../services/api";
import { hasPermission } from "../utils/permissions";

function Dashboard() {
  const { user, permissions } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const canViewDashboard = hasPermission(permissions, "DASHBOARD_VIEW");

  useEffect(() => {
    if (!canViewDashboard) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        const response = await dashboardAPI.getStats();
        setStats(response.data);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
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
                <Button onClick={() => navigate("/projects")}>
                  Go to Projects
                </Button>
              </div>
            </div>
          </Col>
          <Col md={4}>
            <div className="work-card card h-100">
              <div className="card-body">
                <h2 className="work-card-title">Tasks</h2>
                <p className="work-card-text">Track assignments, approvals, and due work.</p>
                <Button onClick={() => navigate("/tasks")}>
                  Go to Tasks
                </Button>
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
    ["Total Projects", stats.projects?.total ?? 0, "All visible projects", "/projects"],
    ["Pending", stats.projects?.pending ?? 0, "Projects waiting to start", "/projects"],
    ["In Progress", stats.projects?.in_progress ?? 0, "Active delivery work", "/projects"],
    ["Completed", stats.projects?.completed ?? 0, "Completed projects", "/projects"],
  ];

  const taskMetrics = [
    ["Total Tasks", stats.tasks?.total ?? 0, "All visible tasks", "/tasks"],
    ["Todo", stats.tasks?.todo ?? stats.tasks?.pending ?? 0, "Ready to be picked up", "/tasks"],
    ["In Progress", stats.tasks?.in_progress ?? 0, "Work currently moving", "/tasks"],
    ["Done", stats.tasks?.done ?? stats.tasks?.completed ?? 0, "Completed task items", "/tasks"],
  ];

  return (
    <Container fluid className="page-shell">
      <div className="page-header">
        <div>
          <p className="page-kicker">Dashboard</p>
          <h1 className="page-title">Good to see you, {user?.name}</h1>
          <p className="page-description">A quick view of project progress and task movement.</p>
        </div>
        <Button onClick={() => navigate("/tasks")}>View Tasks</Button>
      </div>

      <div className="metric-grid">
        {projectMetrics.map(([label, value, note, target]) => (
          <button className="metric-card text-start" key={label} onClick={() => navigate(target)}>
            <p className="metric-label">{label}</p>
            <div className="metric-value">{value}</div>
            <p className="metric-note">{note}</p>
          </button>
        ))}
      </div>

      <div className="metric-grid">
        {taskMetrics.map(([label, value, note, target]) => (
          <button className="metric-card text-start" key={label} onClick={() => navigate(target)}>
            <p className="metric-label">{label}</p>
            <div className="metric-value">{value}</div>
            <p className="metric-note">{note}</p>
          </button>
        ))}
      </div>
    </Container>
  );
}

export default Dashboard;
