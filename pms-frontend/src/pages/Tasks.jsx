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
import { usePermissions } from "../hooks/usePermissions";
import { tasksAPI, projectsAPI, usersAPI, projectMembersAPI } from "../services/api";
import { PERMISSIONS } from "../utils/permissions";

function Tasks() {
  const { user } = useAuth();
  const { hasPermission, permissions } = usePermissions();
  const navigate = useNavigate();


  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(null); // null means all tasks
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    project_id: "",
    assigned_to: "",
    start_date: "",
    due_date: "",
  });
  const [assignableUsers, setAssignableUsers] = useState([]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, retryCount]);

  useEffect(() => {
    // Filter tasks based on search term
    if (searchTerm.trim() === "") {
      setFilteredTasks(tasks);
    } else {
      const filtered = tasks.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredTasks(filtered);
    }
  }, [tasks, searchTerm]);

  const fetchData = async () => {
    try {
      setError(""); // Clear any previous errors
      let taskParams = {};
      let projectsData = [];
      let tasksData = [];



      // Check if user has required permissions
      if (!hasPermission(PERMISSIONS.TASK_VIEW)) {
        setError("You do not have permission to view tasks. Please contact your administrator.");
        setLoading(false);
        return;
      }

      if (hasPermission(PERMISSIONS.PROJECT_VIEW_ALL)) {

        // Admin sees all tasks
        if (statusFilter) {
          taskParams.status_filter = statusFilter;
        }
        const [tasksRes, projectsRes, usersRes] = await Promise.all([
          tasksAPI.getAll(taskParams).catch(err => {
            console.error('Failed to fetch tasks:', err);
            return { data: [] };
          }),
          projectsAPI.getAll().catch(err => {
            console.error('Failed to fetch projects:', err);
            return { data: [] };
          }),
          usersAPI.getAll().catch(err => {
            console.error('Failed to fetch users:', err);
            return { data: [] };
          }),
        ]);
        tasksData = tasksRes.data || [];
        projectsData = projectsRes.data || [];
        setUsers(usersRes.data || []);
      } else {

        // Non-admin users see tasks from their projects
        try {
          const membershipsRes = await projectMembersAPI.getByUser(user.id);


          // Get project IDs where user is a member
          const memberProjectIds = membershipsRes.data.map(membership => membership.project_id);


          if (memberProjectIds.length === 0) {

            setError("You are not assigned to any projects. Please contact your administrator.");
            setTasks([]);
            setProjects([]);
            setUsers([]);
            setLoading(false);
            return;
          }

          const [projectsRes, usersRes] = await Promise.all([
            projectsAPI.getAll().catch(err => {
              console.error('Failed to fetch projects:', err);
              return { data: [] };
            }),
            usersAPI.getAll().catch(err => {
              console.error('Failed to fetch users:', err);
              return { data: [] };
            }),
          ]);

          // Filter projects to only member ones
          projectsData = (projectsRes.data || []).filter(project => memberProjectIds.includes(project.id));


          // Get tasks for member projects
          taskParams.project_ids = memberProjectIds.join(',');
          if (statusFilter) {
            taskParams.status_filter = statusFilter;
          }

          const tasksRes = await tasksAPI.getAll(taskParams).catch(err => {
            console.error('Failed to fetch tasks for projects:', err);
            return { data: [] };
          });
          tasksData = tasksRes.data || [];


          setUsers(usersRes.data || []);
        } catch (membershipError) {
          console.error('Failed to fetch user memberships:', membershipError);
          setError("Failed to load your project memberships. Please try again.");
          setTasks([]);
          setProjects([]);
          setUsers([]);
          setLoading(false);
          return;
        }
      }


      setTasks(tasksData);
      setProjects(projectsData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      const errorMessage = error.response?.data?.detail ||
                          error.response?.data?.message ||
                          error.message ||
                          "Failed to load data. Please check your connection and try again.";
      setError(errorMessage);
      // Set empty data on error
      setTasks([]);
      setProjects([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Get projects where user is a project manager
  const getManagedProjects = () => {
    if (hasPermission(PERMISSIONS.PROJECT_VIEW_ALL)) {
      return projects; // Admin can manage all projects
    }

    // For project managers, get projects where they have PROJECT_MANAGER role
    return projects.filter(project => {
      // This would need to be enhanced to check actual project manager role
      // For now, return all assigned projects (simplified)
      return true; // TODO: Filter by actual PM role
    });
  };

  // Get assignable users for a project (members of the project)
  const getAssignableUsers = async (projectId) => {
    if (!projectId) return [];

    try {
      const membersRes = await projectMembersAPI.getByProject(projectId);
      const memberIds = membersRes.data.map(member => member.user_id);
      return users.filter(user => memberIds.includes(user.id) && user.status === "ACTIVE");
    } catch (error) {
      console.error("Failed to fetch project members:", error);
      return [];
    }
  };

  const handleAddTask = async () => {
    try {
      const taskData = {
        ...newTask,
        project_id: parseInt(newTask.project_id),
        assigned_to: newTask.assigned_to ? parseInt(newTask.assigned_to) : null,
        start_date: newTask.start_date || null,
        due_date: newTask.due_date || null,
      };
      const response = await tasksAPI.create(taskData);
      setTasks([...tasks, response.data]);
      setNewTask({
        title: "",
        description: "",
        project_id: "",
        assigned_to: "",
        start_date: "",
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
    if (status === "DONE") return "success";
    if (status === "IN_PROGRESS") return "warning";
    if (status === "BLOCKED") return "danger";
    if (status === "CANCELLED") return "secondary";
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
            {!hasPermission(PERMISSIONS.PROJECT_VIEW_ALL)
              ? "Tasks from your projects"
              : "All tasks across projects"}
          </p>
        </div>
        {hasPermission(PERMISSIONS.TASK_CREATE) && (
          <Button onClick={() => {
            setShowAddModal(true);
            setAssignableUsers([]);
            setNewTask({
              title: "",
              description: "",
              project_id: "",
              assigned_to: "",
              start_date: "",
              due_date: "",
            });
          }}>Add Task</Button>
        )}
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
          <div className="mt-2">
            <Button variant="outline-light" size="sm" onClick={handleRetry}>
              Retry Loading
            </Button>
          </div>
        </Alert>
      )}

      {/* Search Bar */}
      <div className="mb-3">
        <Form.Control
          type="text"
          placeholder="Search tasks by title or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-3"
        />
      </div>

      {/* Status Filter Buttons */}
      <div className="mb-3">
        <Button
          variant={statusFilter === null ? "primary" : "outline-primary"}
          className="me-2"
          onClick={() => setStatusFilter(null)}
        >
          All Tasks
        </Button>
        <Button
          variant={statusFilter === "TODO" ? "primary" : "outline-secondary"}
          className="me-2"
          onClick={() => setStatusFilter("TODO")}
        >
          Todo
        </Button>
        <Button
          variant={statusFilter === "IN_PROGRESS" ? "primary" : "outline-warning"}
          className="me-2"
          onClick={() => setStatusFilter("IN_PROGRESS")}
        >
          In Progress
        </Button>
        <Button
          variant={statusFilter === "DONE" ? "primary" : "outline-success"}
          onClick={() => setStatusFilter("DONE")}
        >
          Done
        </Button>
      </div>

      <Table bordered hover responsive className="mt-3">
        <thead>
          <tr>
            <th>Task</th>
            <th>Project</th>
            <th>Assigned To</th>
            <th>Status</th>
            <th>Progress</th>
            <th>Start Date</th>
            <th>Due Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredTasks.length === 0 ? (
            <tr>
              <td colSpan="8" className="text-center py-4">
                <div className="text-muted">
                  {loading ? "Loading tasks..." : "No tasks found"}
                </div>
                {!loading && (
                  <Button variant="outline-primary" size="sm" className="mt-2" onClick={handleRetry}>
                    Refresh
                  </Button>
                )}
              </td>
            </tr>
          ) : (
            filteredTasks.map((task) => (
              <tr key={task.id}>
                <td>{task.title}</td>
                <td>{getProjectName(task.project_id)}</td>
                <td>{getUserName(task.assigned_to)}</td>
                <td>
                  <Badge bg={getStatusVariant(task.status)}>
                    {getStatusLabel(task.status)}
                  </Badge>
                </td>
                <td>{(isNaN(task.progress) ? 0 : parseFloat(task.progress)).toFixed(0)}%</td>
                <td>
                  {task.start_date
                    ? new Date(task.start_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })
                    : "N/A"}
                </td>
                <td>
                  {task.due_date
                    ? new Date(task.due_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })
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
                  {(hasPermission(PERMISSIONS.TASK_EDIT) ||
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
                  {hasPermission(PERMISSIONS.TASK_DELETE) && (
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
            ))
          )}
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
                onChange={async (e) => {
                  const projectId = e.target.value;
                  setNewTask({ ...newTask, project_id: projectId, assigned_to: "" });
                  // Update assignable users when project changes
                  if (projectId) {
                    const assignableUsers = await getAssignableUsers(projectId);
                    setAssignableUsers(assignableUsers);
                  } else {
                    setAssignableUsers([]);
                  }
                }}
              >
                <option value="">Select Project</option>
                {getManagedProjects().map((project) => (
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
                disabled={!newTask.project_id}
              >
                <option value="">Unassigned</option>
                {assignableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </Form.Select>
              {!newTask.project_id && (
                <Form.Text className="text-muted">
                  Select a project first to see assignable team members
                </Form.Text>
              )}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Start Date</Form.Label>
              <Form.Control
                type="date"
                value={newTask.start_date}
                onChange={(e) =>
                  setNewTask({ ...newTask, start_date: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Due Date</Form.Label>
              <Form.Control
                type="date"
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
                  readOnly
                  disabled
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={editingTask.description || ""}
                  readOnly
                  disabled
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={editingTask.status}
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    let newProgress = editingTask.progress;
                    if (newStatus === "TODO") {
                      newProgress = 0;
                    } else if (newStatus === "IN_PROGRESS") {
                      newProgress = 50;
                    } else if (newStatus === "DONE") {
                      newProgress = 100;
                    }
                    setEditingTask({ ...editingTask, status: newStatus, progress: newProgress });
                  }}
                >
                  <option value="TODO">Todo</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="BLOCKED">Blocked</option>
                  <option value="DONE">Done</option>
                  <option value="CANCELLED">Cancelled</option>
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
                  readOnly
                  disabled
                />
                <Form.Text className="text-muted">
                  Progress is automatically set based on status
                </Form.Text>
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
          >
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default Tasks;
