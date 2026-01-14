import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Table from "react-bootstrap/Table";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Alert from "react-bootstrap/Alert";
import { useAuth } from "../context/AuthContext";
import { tasksAPI, projectsAPI, usersAPI } from "../services/api";

function Tasks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    project_id: "",
    assigned_to: "",
    due_date: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, projectsRes, usersRes] = await Promise.all([
        tasksAPI.getAll({ assigned_to: user?.role === "MEMBER" ? user.id : null }),
        projectsAPI.getAll(),
        usersAPI.getAll(),
      ]);
      setTasks(tasksRes.data);
      setProjects(projectsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    try {
      const taskData = {
        ...newTask,
        project_id: parseInt(newTask.project_id),
        assigned_to: newTask.assigned_to ? parseInt(newTask.assigned_to) : null,
        due_date: newTask.due_date || null,
      };
      const response = await tasksAPI.create(taskData);
      setTasks([...tasks, response.data]);
      setNewTask({
        title: "",
        description: "",
        project_id: "",
        assigned_to: "",
        due_date: "",
      });
      setShowAddModal(false);
      setError("");
    } catch (error) {
      setError(error.response?.data?.detail || "Failed to create task");
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      const response = await tasksAPI.update(taskId, updates);
      setTasks(tasks.map((t) => (t.id === taskId ? response.data : t)));
      setError("");
    } catch (error) {
      setError(error.response?.data?.detail || "Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await tasksAPI.delete(taskId);
        setTasks(tasks.filter((t) => t.id !== taskId));
      } catch (error) {
        setError(error.response?.data?.detail || "Failed to delete task");
      }
    }
  };

  const openEditTaskModal = (task) => {
    setEditingTask({
      ...task,
      project_id: task.project_id?.toString() || "",
      assigned_to: task.assigned_to?.toString() || "",
      due_date: task.due_date
        ? new Date(task.due_date).toISOString().slice(0, 16)
        : "",
    });
    setShowEditModal(true);
  };

  const getProjectName = (projectId) => {
    const project = projects.find((p) => p.id === projectId);
    return project ? project.name : "Unknown";
  };

  const getUserName = (userId) => {
    if (!userId) return "Unassigned";
    const foundUser = users.find((u) => u.id === userId);
    return foundUser ? foundUser.name : "Unknown";
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
          <h1>Tasks</h1>
          <p className="text-muted">
            {user?.role === "MEMBER"
              ? "Your assigned tasks"
              : "All tasks across projects"}
          </p>
        </div>
        {(user?.role === "ADMIN" || user?.role === "PROJECT_MANAGER") && (
          <Button onClick={() => setShowAddModal(true)}>Add Task</Button>
        )}
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Table bordered hover responsive className="mt-3">
        <thead>
          <tr>
            <th>Task</th>
            <th>Project</th>
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
              <td>{getProjectName(task.project_id)}</td>
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

      {/* Add Task Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
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
              <Form.Label>Project</Form.Label>
              <Form.Select
                value={newTask.project_id}
                onChange={(e) =>
                  setNewTask({ ...newTask, project_id: e.target.value })
                }
              >
                <option value="">Select Project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </Form.Select>
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
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAddTask}
            disabled={!newTask.title.trim() || !newTask.project_id}
          >
            Save Task
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Task Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
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
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              handleUpdateTask(editingTask.id, {
                status: editingTask.status,
                progress: editingTask.progress,
              });
              setShowEditModal(false);
            }}
            disabled={!editingTask?.title.trim()}
          >
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default Tasks;
