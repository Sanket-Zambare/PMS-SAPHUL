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
import { usePermissions } from "../hooks/usePermissions";
import { projectsAPI, usersAPI, projectMembersAPI } from "../services/api";
import { PERMISSIONS } from "../utils/permissions";

function Projects() {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();


  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null); // null means all projects
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    methodology: "AGILE",
    status: "PENDING",
    start_date: "",
    end_date: "",
  });
  const [users, setUsers] = useState([]);
  const [selectedProjectManager, setSelectedProjectManager] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [pmSearchTerm, setPmSearchTerm] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProjects();
    if (hasPermission(PERMISSIONS.USER_VIEW_ALL) || hasPermission(PERMISSIONS.PROJECT_EDIT)) {
      fetchUsers();
    }
  }, [statusFilter]);

  useEffect(() => {
    // Filter projects based on search term
    if (searchTerm.trim() === "") {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredProjects(filtered);
    }
  }, [projects, searchTerm]);

  const fetchProjects = async () => {
    try {
      const response = await projectsAPI.getAll(0, 100, statusFilter);
      setProjects(response.data);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      setError("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const handleAddProject = async () => {
    try {
      console.log("Creating project with data:", newProject);
      const response = await projectsAPI.create(newProject);
      console.log("Project created successfully:", response.data);
      const projectId = response.data.id;

      // Assign project manager if selected
      if (selectedProjectManager) {
        await projectMembersAPI.assign({
          project_id: projectId,
          user_id: selectedProjectManager,
          role: "PROJECT_MANAGER"
        });
      }

      // Assign members if selected
      for (const memberId of selectedMembers) {
        await projectMembersAPI.assign({
          project_id: projectId,
          user_id: memberId,
          role: "MEMBER"
        });
      }

      setProjects([...projects, response.data]);
      setNewProject({ name: "", description: "", methodology: "AGILE", status: "PENDING", start_date: "", end_date: "" });
      setSelectedProjectManager("");
      setSelectedMembers([]);
      setMemberSearchTerm("");
      setPmSearchTerm("");
      setShowAddModal(false);
      setError("");
    } catch (error) {
      console.error("Error creating project:", error);
      const errorMessage = error.response?.data?.detail || error.message || "Failed to create project";
      setError(errorMessage);
      // Don't close modal on error so user can see the error and try again
    }
  };

  const handleEditProject = async () => {
    try {
      const response = await projectsAPI.update(editingProject.id, {
        name: editingProject.name,
        description: editingProject.description,
        status: editingProject.status,
        start_date: editingProject.start_date,
        end_date: editingProject.end_date,
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

  // Helper functions for member selection
  const getFilteredUsers = () => {
    if (!memberSearchTerm.trim()) return [];

    return users.filter(user =>
      !selectedMembers.includes(user.id) &&
      (user.name.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
       user.email.toLowerCase().includes(memberSearchTerm.toLowerCase()))
    );
  };

  const addMember = (userId) => {
    if (!selectedMembers.includes(userId)) {
      setSelectedMembers([...selectedMembers, userId]);
    }
  };

  const removeMember = (userId) => {
    setSelectedMembers(selectedMembers.filter(id => id !== userId));
  };

  // Helper function for project manager selection
  const getFilteredPMs = () => {
    if (!pmSearchTerm.trim()) return [];

    return users.filter(user =>
      user.name.toLowerCase().includes(pmSearchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(pmSearchTerm.toLowerCase())
    );
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
        {hasPermission(PERMISSIONS.PROJECT_CREATE) && (
          <Button onClick={() => setShowAddModal(true)}>Add Project</Button>
        )}
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Search Bar */}
      <div className="mb-3">
        <Form.Control
          type="text"
          placeholder="Search projects by name or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Status Filter Buttons */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        <Button
          variant={statusFilter === null ? "primary" : "outline-primary"}
          onClick={() => setStatusFilter(null)}
        >
          All Projects
        </Button>
        <Button
          variant={statusFilter === "PENDING" ? "primary" : "outline-secondary"}
          onClick={() => setStatusFilter("PENDING")}
        >
          Pending
        </Button>
        <Button
          variant={statusFilter === "IN_PROGRESS" ? "primary" : "outline-warning"}
          onClick={() => setStatusFilter("IN_PROGRESS")}
        >
          In Progress
        </Button>
        <Button
          variant={statusFilter === "COMPLETED" ? "primary" : "outline-success"}
          onClick={() => setStatusFilter("COMPLETED")}
        >
          Completed
        </Button>
        <Button
          variant={statusFilter === "DELAYED" ? "primary" : "outline-danger"}
          onClick={() => setStatusFilter("DELAYED")}
        >
          Delayed
        </Button>
      </div>

      <Row className="g-4">
        {filteredProjects.map((project) => (
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
                {(project.start_date || project.end_date) && (
                  <div className="mb-2">
                    <small className="text-muted">
                      {project.start_date && `Start: ${new Date(project.start_date).toLocaleDateString()}`}
                      {project.start_date && project.end_date && " | "}
                      {project.end_date && `End: ${new Date(project.end_date).toLocaleDateString()}`}
                    </small>
                  </div>
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
                  {hasPermission(PERMISSIONS.PROJECT_EDIT) && (
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
            <Form.Group className="mb-3">
              <Form.Label>Methodology</Form.Label>
              <Form.Select
                value={newProject.methodology}
                onChange={(e) =>
                  setNewProject({ ...newProject, methodology: e.target.value })
                }
              >
                <option value="AGILE">Agile</option>
                <option value="WATERFALL">Waterfall</option>
                <option value="HYBRID">Hybrid</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Start Date</Form.Label>
              <Form.Control
                type="date"
                value={newProject.start_date}
                onChange={(e) =>
                  setNewProject({ ...newProject, start_date: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>End Date</Form.Label>
              <Form.Control
                type="date"
                value={newProject.end_date}
                onChange={(e) =>
                  setNewProject({ ...newProject, end_date: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Project Manager (Optional)</Form.Label>

              {hasPermission(PERMISSIONS.USER_VIEW_ALL) || hasPermission(PERMISSIONS.PROJECT_EDIT) ? (
                <>
                  {/* Search input for selecting project manager */}
                  <div className="position-relative">
                    <Form.Control
                      type="text"
                      placeholder="Type to search project managers..."
                      value={pmSearchTerm}
                      onChange={(e) => setPmSearchTerm(e.target.value)}
                      className="mb-2"
                    />

                    {/* Dropdown with filtered users - only show when typing */}
                    {pmSearchTerm && (
                      <div className="position-absolute w-100 border rounded bg-white shadow-sm" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                        {getFilteredPMs().map((user) => (
                          <div
                            key={user.id}
                            className="d-flex justify-content-between align-items-center p-2 border-bottom cursor-pointer hover-bg-light"
                            onClick={() => {
                              setSelectedProjectManager(user.id);
                              setPmSearchTerm(""); // Clear search after selecting
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            <div>
                              <div className="fw-bold">{user.name}</div>
                              <small className="text-muted">{user.email}</small>
                            </div>
                            <Button variant="outline-primary" size="sm">Select</Button>
                          </div>
                        ))}
                        {getFilteredPMs().length === 0 && (
                          <div className="text-muted p-3 text-center">No users found</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selected project manager display */}
                  {selectedProjectManager && (
                    <div className="mt-2">
                      <Form.Text className="text-muted mb-2 d-block">
                        Selected Project Manager:
                      </Form.Text>
                      <div className="d-flex align-items-center bg-light px-2 py-1 rounded-pill">
                        <span className="me-2">{users.find(u => u.id === selectedProjectManager)?.name}</span>
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 text-danger"
                          onClick={() => setSelectedProjectManager("")}
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-muted">
                  <small>You don't have permission to assign project managers.</small>
                </div>
              )}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Team Members (Optional)</Form.Label>

              {hasPermission(PERMISSIONS.USER_VIEW_ALL) || hasPermission(PERMISSIONS.PROJECT_EDIT) ? (
                <>
                  {/* Search input for adding members */}
                  <div className="position-relative">
                    <Form.Control
                      type="text"
                      placeholder="Type to search and add members..."
                      value={memberSearchTerm}
                      onChange={(e) => setMemberSearchTerm(e.target.value)}
                      className="mb-2"
                    />

                    {/* Dropdown with filtered users - only show when typing */}
                    {memberSearchTerm && (
                      <div className="position-absolute w-100 border rounded bg-white shadow-sm" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                        {getFilteredUsers().map((user) => (
                          <div
                            key={user.id}
                            className="d-flex justify-content-between align-items-center p-2 border-bottom cursor-pointer hover-bg-light"
                            onClick={() => {
                              addMember(user.id);
                              setMemberSearchTerm(""); // Clear search after adding
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            <div>
                              <div className="fw-bold">{user.name}</div>
                              <small className="text-muted">{user.email}</small>
                            </div>
                            <Button variant="outline-primary" size="sm">+</Button>
                          </div>
                        ))}
                        {getFilteredUsers().length === 0 && (
                          <div className="text-muted p-3 text-center">No users found</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selected members list */}
                  {selectedMembers.length > 0 && (
                    <div className="mt-3">
                      <Form.Text className="text-muted mb-2 d-block">
                        Selected Members ({selectedMembers.length}):
                      </Form.Text>
                      <div className="d-flex flex-wrap gap-2">
                        {selectedMembers.map((memberId) => {
                          const member = users.find(u => u.id === memberId);
                          return (
                            <div key={memberId} className="d-flex align-items-center bg-light px-2 py-1 rounded-pill">
                              <span className="me-2">{member?.name}</span>
                              <Button
                                variant="link"
                                size="sm"
                                className="p-0 text-danger"
                                onClick={() => removeMember(memberId)}
                              >
                                ×
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-muted">
                  <small>You don't have permission to assign team members.</small>
                </div>
              )}
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
              <Form.Group className="mb-3">
                <Form.Label>Start Date</Form.Label>
                <Form.Control
                  type="date"
                  value={editingProject.start_date || ""}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      start_date: e.target.value,
                    })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>End Date</Form.Label>
                <Form.Control
                  type="date"
                  value={editingProject.end_date || ""}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      end_date: e.target.value,
                    })
                  }
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
                  <option value="DELAYED">Delayed</option>
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
