import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Alert from "react-bootstrap/Alert";
import { useAuth } from "../context/AuthContext";
import { projectsAPI } from "../services/api";

function Projects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    status: "PENDING",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await projectsAPI.getAll();
      setProjects(response.data);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      setError("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProject = async () => {
    try {
      const response = await projectsAPI.create(newProject);
      setProjects([...projects, response.data]);
      setNewProject({ name: "", description: "", status: "PENDING" });
      setShowAddModal(false);
      setError("");
    } catch (error) {
      setError(error.response?.data?.detail || "Failed to create project");
    }
  };

  const handleEditProject = async () => {
    try {
      const response = await projectsAPI.update(editingProject.id, {
        name: editingProject.name,
        description: editingProject.description,
        status: editingProject.status,
      });
      setProjects(
        projects.map((p) => (p.id === editingProject.id ? response.data : p))
      );
      setEditingProject(null);
      setShowEditModal(false);
      setError("");
    } catch (error) {
      setError(error.response?.data?.detail || "Failed to update project");
    }
  };

  const handleDeleteProject = async (id) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        await projectsAPI.delete(id);
        setProjects(projects.filter((p) => p.id !== id));
      } catch (error) {
        setError(error.response?.data?.detail || "Failed to delete project");
      }
    }
  };

  const openEditModal = (project) => {
    setEditingProject({ ...project });
    setShowEditModal(true);
  };

  const getStatusVariant = (status) => {
    if (status === "COMPLETED") return "success";
    if (status === "IN_PROGRESS") return "warning";
    return "secondary";
  };

  const getStatusLabel = (status) => {
    return status.replace("_", " ");
  };

  if (loading) {
    return (
      <Container fluid className="mt-3">
        <div>Loading...</div>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1>Projects</h1>
          <p className="text-muted">All active and completed projects</p>
        </div>
        {user?.role === "ADMIN" && (
          <Button onClick={() => setShowAddModal(true)}>Add Project</Button>
        )}
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Row className="g-4">
        {projects.map((project) => (
          <Col md={4} key={project.id}>
            <Card className="h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <Card.Title>{project.name}</Card.Title>
                  <Badge bg={getStatusVariant(project.status)}>
                    {getStatusLabel(project.status)}
                  </Badge>
                </div>
                {project.description && (
                  <Card.Text className="text-muted">
                    {project.description.substring(0, 100)}
                    {project.description.length > 100 ? "..." : ""}
                  </Card.Text>
                )}
                {project.review_status && (
                  <div className="mb-2">
                    <small>
                      Review: <Badge bg="info">{project.review_status}</Badge>
                    </small>
                  </div>
                )}
                <div className="d-flex gap-2 mt-3">
                  <Link
                    to={`/projects/${project.id}`}
                    style={{ flex: 1 }}
                  >
                    <Button variant="primary" className="w-100">
                      View Project
                    </Button>
                  </Link>
                  {user?.role === "ADMIN" && (
                    <>
                      <Button
                        variant="outline-secondary"
                        onClick={() => openEditModal(project)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline-danger"
                        onClick={() => handleDeleteProject(project.id)}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Add Project Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Project</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Project Name</Form.Label>
              <Form.Control
                value={newProject.name}
                onChange={(e) =>
                  setNewProject({ ...newProject, name: e.target.value })
                }
                placeholder="Enter project name"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newProject.description}
                onChange={(e) =>
                  setNewProject({
                    ...newProject,
                    description: e.target.value,
                  })
                }
                placeholder="Enter project description"
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={newProject.status}
                onChange={(e) =>
                  setNewProject({ ...newProject, status: e.target.value })
                }
              >
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAddProject}
            disabled={!newProject.name.trim()}
          >
            Save Project
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Project Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Project</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingProject && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Project Name</Form.Label>
                <Form.Control
                  value={editingProject.name}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      name: e.target.value,
                    })
                  }
                  placeholder="Enter project name"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={editingProject.description || ""}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      description: e.target.value,
                    })
                  }
                  placeholder="Enter project description"
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={editingProject.status}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      status: e.target.value,
                    })
                  }
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </Form.Select>
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleEditProject}
            disabled={!editingProject?.name.trim()}
          >
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default Projects;
