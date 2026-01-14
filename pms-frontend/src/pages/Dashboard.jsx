import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { useAuth } from "../context/AuthContext";
import { dashboardAPI } from "../services/api";

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  if (loading) {
    return (
      <Container fluid className="mt-3">
        <div>Loading...</div>
      </Container>
    );
  }

  if (!stats) {
    return (
      <Container fluid className="mt-3">
        <div>Failed to load statistics</div>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-3">
      <h1>Dashboard</h1>
      <p className="text-muted">
        Welcome, {user?.name} ({user?.role})
      </p>

      <Row className="g-4">
        {stats.projects && (
          <>
            <Col md={3}>
              <Card className="h-100">
                <Card.Body>
                  <Card.Title>Total Projects</Card.Title>
                  <Card.Text style={{ fontSize: "2rem", fontWeight: "bold" }}>
                    {stats.projects.total}
                  </Card.Text>
                  <Button
                    variant="primary"
                    onClick={() => navigate("/projects")}
                  >
                    View Projects
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            <Col md={3}>
              <Card className="h-100">
                <Card.Body>
                  <Card.Title>Pending Projects</Card.Title>
                  <Card.Text style={{ fontSize: "2rem", fontWeight: "bold" }}>
                    {stats.projects.pending}
                  </Card.Text>
                  <Button
                    variant="secondary"
                    onClick={() => navigate("/projects")}
                  >
                    View
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            <Col md={3}>
              <Card className="h-100">
                <Card.Body>
                  <Card.Title>In Progress</Card.Title>
                  <Card.Text style={{ fontSize: "2rem", fontWeight: "bold" }}>
                    {stats.projects.in_progress}
                  </Card.Text>
                  <Button
                    variant="warning"
                    onClick={() => navigate("/projects")}
                  >
                    View
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            <Col md={3}>
              <Card className="h-100">
                <Card.Body>
                  <Card.Title>Completed</Card.Title>
                  <Card.Text style={{ fontSize: "2rem", fontWeight: "bold" }}>
                    {stats.projects.completed}
                  </Card.Text>
                  <Button
                    variant="success"
                    onClick={() => navigate("/projects")}
                  >
                    View
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </>
        )}

        {stats.tasks && (
          <>
            <Col md={3}>
              <Card className="h-100">
                <Card.Body>
                  <Card.Title>Total Tasks</Card.Title>
                  <Card.Text style={{ fontSize: "2rem", fontWeight: "bold" }}>
                    {stats.tasks.total}
                  </Card.Text>
                  <Button
                    variant="primary"
                    onClick={() => navigate("/tasks")}
                  >
                    View Tasks
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            <Col md={3}>
              <Card className="h-100">
                <Card.Body>
                  <Card.Title>Pending Tasks</Card.Title>
                  <Card.Text style={{ fontSize: "2rem", fontWeight: "bold" }}>
                    {stats.tasks.pending}
                  </Card.Text>
                  <Button
                    variant="secondary"
                    onClick={() => navigate("/tasks")}
                  >
                    View
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            <Col md={3}>
              <Card className="h-100">
                <Card.Body>
                  <Card.Title>In Progress Tasks</Card.Title>
                  <Card.Text style={{ fontSize: "2rem", fontWeight: "bold" }}>
                    {stats.tasks.in_progress}
                  </Card.Text>
                  <Button
                    variant="warning"
                    onClick={() => navigate("/tasks")}
                  >
                    View
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            <Col md={3}>
              <Card className="h-100">
                <Card.Body>
                  <Card.Title>Completed Tasks</Card.Title>
                  <Card.Text style={{ fontSize: "2rem", fontWeight: "bold" }}>
                    {stats.tasks.completed}
                  </Card.Text>
                  <Button
                    variant="success"
                    onClick={() => navigate("/tasks")}
                  >
                    View
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </>
        )}

        {stats.users && (
          <Col md={3}>
            <Card className="h-100">
              <Card.Body>
                <Card.Title>Total Users</Card.Title>
                <Card.Text style={{ fontSize: "2rem", fontWeight: "bold" }}>
                  {stats.users.total}
                </Card.Text>
                <Button
                  variant="primary"
                  onClick={() => navigate("/users")}
                >
                  View Users
                </Button>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>
    </Container>
  );
}

export default Dashboard;
