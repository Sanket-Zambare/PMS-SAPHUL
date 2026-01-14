import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";
import Table from "react-bootstrap/Table";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Alert from "react-bootstrap/Alert";
import { useAuth } from "../context/AuthContext";
import {
  projectsAPI,
  tasksAPI,
  projectMembersAPI,
  usersAPI,
  activityLogsAPI,
  dashboardAPI,
} from "../services/api";

function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const projectId = parseInt(id);

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [users, setUsers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assigned_to: "",
    due_date: "",
  });

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      const [projectRes, tasksRes, membersRes, usersRes, logsRes, statsRes] =
        await Promise.all([
          projectsAPI.getById(projectId),
          tasksAPI.getAll({ project_id: projectId }),
          projectMembersAPI.getByProject(projectId),
          usersAPI.getAll(),
          activityLogsAPI.getByProject(projectId, 0, 20),
          dashboardAPI.getProjectStats(projectId),
        ]);

      setProject(projectRes.data);
      setTasks(tasksRes.data);
      setMembers(membersRes.data);
      setUsers(usersRes.data);
      setActivityLogs(logsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Failed to fetch project data:", error);
      setError("Failed to load project data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    try {
      const taskData = {
        ...newTask,
        project_id: projectId,
        assigned_to: newTask.assigned_to ? parseInt(newTask.assigned_to) : null,
        due_date: newTask.due_date || null,
      };
      const response = await tasksAPI.create(taskData);
      setTasks([...tasks, response.data]);
      setNewTask({
        title: "",
        description: "",
        assigned_to: "",
        due_date: "",
      });
      setShowAddTaskModal(false);
      fetchProjectData(); // Refresh stats
    } catch (error) {
      setError(error.response?.data?.detail || "Failed to create task");
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      const response = await tasksAPI.update(taskId, updates);
      setTasks(tasks.map((t) => (t.id === taskId ? response.data : t)));
      fetchProjectData(); // Refresh stats
    } catch (error) {
      setError(error.response?.data?.detail || "Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await tasksAPI.delete(taskId);
        setTasks(tasks.filter((t) => t.id !== taskId));
        fetchProjectData(); // Refresh stats
      } catch (error) {
        setError(error.response?.data?.detail || "Failed to delete task");
      }
    }
  };

  const handleApproveProject = async () => {
    try {
      const response = await projectsAPI.approve(projectId);
      setProject(response.data);
      setShowApproveModal(false);
      fetchProjectData();
    } catch (error) {
      setError(error.response?.data?.detail || "Failed to approve project");
    }
  };

  const openEditTaskModal = (task) => {
    setEditingTask({
      ...task,
      assigned_to: task.assigned_to?.toString() || "",
      due_date: task.due_date
        ? new Date(task.due_date).toISOString().split("T")[0]
        : "",
    });
    setShowEditTaskModal(true);
  };

  const getUserName = (userId) => {
    const foundUser = users.find((u) => u.id === userId);
    return foundUser ? foundUser.name : "Unassigned";
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

  if (!project) {
    return (
      <Container fluid className="mt-3">
        <h2>Project Not Found</h2>
        <Button onClick={() => navigate("/projects")}>Back to Projects</Button>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h2>{project.name}</h2>
          <div className="d-flex gap-2 align-items-center">
            <Badge bg={getStatusVariant(project.status)}>
              {getStatusLabel(project.status)}
            </Badge>
            {project.review_status && (
              <Badge bg="info">{project.review_status}</Badge>
            )}
          </div>
        </div>
        <Button onClick={() => navigate("/projects")}>Back to Projects</Button>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Row className="mt-4">
        <Col md={4}>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Project Info</Card.Title>
              <Card.Text>
                <strong>Name:</strong> {project.name}
              </Card.Text>
              {project.description && (
                <Card.Text>
                  <strong>Description:</strong> {project.description}
                </Card.Text>
              )}
              <Card.Text>
                <strong>Status:</strong> {getStatusLabel(project.status)}
              </Card.Text>
              {project.review_status && (
                <Card.Text>
                  <strong>Review Status:</strong> {project.review_status}
                </Card.Text>
              )}
              {stats && (
                <>
                  <Card.Text>
                    <strong>Total Tasks:</strong> {stats.total_tasks}
                  </Card.Text>
                  <Card.Text>
                    <strong>Average Progress:</strong>{" "}
                    {parseFloat(stats.average_progress).toFixed(1)}%
                  </Card.Text>
                </>
              )}
              {user?.role === "ADMIN" &&
                project.status === "COMPLETED" &&
                project.review_status === "PENDING" && (
                  <Button
                    variant="success"
                    className="mt-2"
                    onClick={() => setShowApproveModal(true)}
                  >
                    Approve Project
                  </Button>
                )}
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <Card.Title>Activity Timeline</Card.Title>
              <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                {activityLogs.length === 0 ? (
                  <p className="text-muted">No activity yet</p>
                ) : (
                  activityLogs.map((log) => (
                    <div key={log.id} className="mb-2">
                      <small className="text-muted">
                        {new Date(log.created_at).toLocaleString()}
                      </small>
                      <div>{log.description || log.activity_type}</div>
                    </div>
                  ))
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <Card.Title>Tasks</Card.Title>
                {(user?.role === "ADMIN" || user?.role === "PROJECT_MANAGER") && (
                  <Button onClick={() => setShowAddTaskModal(true)}>
                    Add Task
                  </Button>
                )}
              </div>
              {tasks.length === 0 ? (
                <p className="text-muted">No tasks for this project yet.</p>
              ) : (
                <Table bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Assigned To</th>
                      <th>Status</th>
                      <th>Progress</th>
                      <th>Due Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr key={task.id}>
                        <td>{task.title}</td>
                        <td>{getUserName(task.assigned_to)}</td>
                        <td>
                          <Badge bg={getStatusVariant(task.status)}>
                            {getStatusLabel(task.status)}
                          </Badge>
                        </td>
                        <td>{parseFloat(task.progress).toFixed(0)}%</td>
                        <td>
                          {task.due_date
                            ? new Date(task.due_date).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => navigate(`/tasks/${task.id}`)}
                          >
                            View
                          </Button>
                          {(user?.role === "ADMIN" ||
                            user?.role === "PROJECT_MANAGER" ||
                            task.assigned_to === user?.id) && (
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              className="me-2"
                              onClick={() => openEditTaskModal(task)}
                            >
                              Edit
                            </Button>
                          )}
                          {(user?.role === "ADMIN" ||
                            user?.role === "PROJECT_MANAGER") && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              Delete
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add Task Modal */}
      <Modal
        show={showAddTaskModal}
        onHide={() => setShowAddTaskModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Add Task</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Task Title</Form.Label>
              <Form.Control
                value={newTask.title}
                onChange={(e) =>
                  setNewTask({ ...newTask, title: e.target.value })
                }
                placeholder="Enter task title"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newTask.description}
                onChange={(e) =>
                  setNewTask({ ...newTask, description: e.target.value })
                }
                placeholder="Enter task description"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Assign To</Form.Label>
              <Form.Select
                value={newTask.assigned_to}
                onChange={(e) =>
                  setNewTask({ ...newTask, assigned_to: e.target.value })
                }
              >
                <option value="">Unassigned</option>
                {users
                  .filter((u) => u.status === "ACTIVE")
                  .map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label>Due Date</Form.Label>
              <Form.Control
                type="datetime-local"
                value={newTask.due_date}
                onChange={(e) =>
                  setNewTask({ ...newTask, due_date: e.target.value })
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddTaskModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAddTask}
            disabled={!newTask.title.trim()}
          >
            Save Task
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Task Modal */}
      <Modal
        show={showEditTaskModal}
        onHide={() => setShowEditTaskModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Task</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingTask && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Task Title</Form.Label>
                <Form.Control
                  value={editingTask.title}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, title: e.target.value })
                  }
                  placeholder="Enter task title"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={editingTask.description || ""}
                  onChange={(e) =>
                    setEditingTask({
                      ...editingTask,
                      description: e.target.value,
                    })
                  }
                  placeholder="Enter task description"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={editingTask.status}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, status: e.target.value })
                  }
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Progress (%)</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={parseFloat(editingTask.progress)}
                  onChange={(e) =>
                    setEditingTask({
                      ...editingTask,
                      progress: parseFloat(e.target.value),
                    })
                  }
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Due Date</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={editingTask.due_date}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, due_date: e.target.value })
                  }
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditTaskModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              handleUpdateTask(editingTask.id, {
                title: editingTask.title,
                description: editingTask.description,
                status: editingTask.status,
                progress: editingTask.progress,
                due_date: editingTask.due_date || null,
              });
              setShowEditTaskModal(false);
            }}
            disabled={!editingTask?.title.trim()}
          >
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Approve Project Modal */}
      <Modal show={showApproveModal} onHide={() => setShowApproveModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Approve Project</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to approve this project completion?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowApproveModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleApproveProject}>
            Approve
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default ProjectDetails;
