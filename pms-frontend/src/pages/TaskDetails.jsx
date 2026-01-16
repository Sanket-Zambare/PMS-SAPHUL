import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Alert from "react-bootstrap/Alert";
import ProgressBar from "react-bootstrap/ProgressBar";
import { useAuth } from "../context/AuthContext";
import { usePermissions } from "../hooks/usePermissions";
import { tasksAPI, projectsAPI, usersAPI, projectMembersAPI } from "../services/api";
import { PERMISSIONS, isClient } from "../utils/permissions";

function TaskDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [project, setProject] = useState(null);
  const [assignedUser, setAssignedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTaskDetails();
  }, [id]);

  const fetchTaskDetails = async () => {
    try {
      const taskRes = await tasksAPI.getById(id);
      const projectRes = await projectsAPI.getById(taskRes.data.project_id);

      setTask(taskRes.data);
      setProject(projectRes.data);

      if (!isClient(user)) {
        const usersRes = await usersAPI.getAll();
        const userData = usersRes.data.find(u => u.id === taskRes.data.assigned_to);
        setAssignedUser(userData);
        setUsers(usersRes.data || []);
      } else {
        // For clients, derive users from project members
        const membersRes = await projectMembersAPI.getByProject(taskRes.data.project_id);
        const derivedUsers = membersRes.data.map(member => ({
          id: member.user_id,
          name: "Project Member"
        }));
        const userData = derivedUsers.find(u => u.id === taskRes.data.assigned_to);
        setAssignedUser(userData);
        setUsers(derivedUsers);
      }
    } catch (error) {
      console.error("Failed to fetch task details:", error);
      console.error("Error response:", error.response);
      setError(`Failed to load task details: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async () => {
    try {
      // For users without TASK_EDIT permission, only send status update
      const canEditAll = hasPermission(PERMISSIONS.TASK_EDIT);
      const updateData = canEditAll
        ? {
            title: editingTask.title,
            description: editingTask.description,
            status: editingTask.status,
            progress: editingTask.progress,
          }
        : { status: editingTask.status };

      const response = await tasksAPI.update(task.id, updateData);
      setTask(response.data);
      setShowEditModal(false);
      setError("");
    } catch (error) {
      console.error("Update task error:", error.response?.data);
      let errorMessage = "Failed to update task";
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map(err =>
            typeof err === 'string' ? err : err.msg || JSON.stringify(err)
          ).join(', ');
        } else if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        } else {
          errorMessage = JSON.stringify(error.response.data.detail);
        }
      }
      setError(errorMessage);
    }
  };

  const handleDeleteTask = async () => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await tasksAPI.delete(task.id);
        navigate("/tasks");
      } catch (error) {
        setError(error.response?.data?.detail || "Failed to delete task");
      }
    }
  };

  const openEditModal = () => {
    setEditingTask({
      ...task,
      progress: parseFloat(task.progress),
    });
    setShowEditModal(true);
  };

  const handleRequestApproval = async () => {
    try {
      const response = await tasksAPI.requestApproval(task.id);
      setTask(response.data);
      setError("");
    } catch (error) {
      setError(error.response?.data?.detail || "Failed to request approval");
    }
  };

  const handleApproveTask = async () => {
    if (window.confirm("Are you sure you want to approve this task?")) {
      try {
        const response = await tasksAPI.approve(task.id);
        setTask(response.data);
        setError("");
      } catch (error) {
        setError(error.response?.data?.detail || "Failed to approve task");
      }
    }
  };

  const handleRejectTask = async () => {
    if (window.confirm("Are you sure you want to reject this task?")) {
      try {
        const response = await tasksAPI.reject(task.id);
        setTask(response.data);
        setError("");
      } catch (error) {
        setError(error.response?.data?.detail || "Failed to reject task");
      }
    }
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

  const getReviewStatusVariant = (status) => {
    if (status === "UNDER_REVIEW") return "warning";
    if (status === "APPROVED") return "success";
    if (status === "REJECTED") return "danger";
    return "secondary";
  };

  const getReviewStatusLabel = (status) => {
    if (status === "UNDER_REVIEW") return "Under Review";
    if (status === "APPROVED") return "Approved";
    if (status === "REJECTED") return "Rejected";
    return "None";
  };

  const getApprovalStatusVariant = (status) => {
    if (status === "PENDING") return "warning";
    if (status === "APPROVED") return "success";
    if (status === "REJECTED") return "danger";
    return "secondary";
  };

  const getApprovalStatusLabel = (status) => {
    if (status === "PENDING") return "Pending";
    if (status === "APPROVED") return "Approved";
    if (status === "REJECTED") return "Rejected";
    return "None";
  };

  const getUserName = (userId) => {
    if (!userId) return "Unknown";
    const foundUser = users.find((u) => u.id === userId);
    return foundUser ? foundUser.name : "Unknown";
  };

  if (loading) {
    return (
      <Container fluid className="mt-3">
        <div>Loading task details...</div>
      </Container>
    );
  }

  if (!task) {
    return (
      <Container fluid className="mt-3">
        <Alert variant="danger">Task not found</Alert>
        <Button onClick={() => navigate("/tasks")}>Back to Tasks</Button>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <Button variant="outline-secondary" onClick={() => navigate("/tasks")}>
            ← Back to Tasks
          </Button>
          <h2 className="mt-2">{task.title}</h2>
        </div>
        <div>
          {(hasPermission(PERMISSIONS.TASK_DELETE)) && (
            <Button variant="outline-danger" onClick={handleDeleteTask}>
              Delete Task
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Row>
        <Col md={8}>
          <Card className="mb-3">
            <Card.Header>
              <h5>Task Details</h5>
            </Card.Header>
            <Card.Body>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Status:</strong>{" "}
                  <Badge bg={getStatusVariant(task.status)}>
                    {getStatusLabel(task.status)}
                  </Badge>
                </Col>
                <Col md={6}>
                  <strong>Progress:</strong> {parseFloat(task.progress).toFixed(0)}%
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Review Status:</strong>{" "}
                  <Badge bg={getReviewStatusVariant(task.review_status)}>
                    {getReviewStatusLabel(task.review_status)}
                  </Badge>
                </Col>
                <Col md={6}>
                  <strong>Approval Status:</strong>{" "}
                  <Badge bg={getApprovalStatusVariant(task.approval_status)}>
                    {getApprovalStatusLabel(task.approval_status)}
                  </Badge>
                </Col>
              </Row>
              {task.review_requested_at && (
                <Row className="mb-3">
                  <Col md={6}>
                    <strong>Review Requested:</strong>{" "}
                    {new Date(task.review_requested_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Col>
                  {task.reviewed_at && (
                    <Col md={6}>
                      <strong>Reviewed At:</strong>{" "}
                      {new Date(task.reviewed_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Col>
                  )}
                </Row>
              )}
              {task.reviewed_by && (
                <Row className="mb-3">
                  <Col md={6}>
                    <strong>Reviewed By:</strong> {getUserName(task.reviewed_by)}
                  </Col>
                </Row>
              )}
              <ProgressBar
                now={isNaN(task.progress) ? 0 : parseFloat(task.progress)}
                label={`${(isNaN(task.progress) ? 0 : parseFloat(task.progress)).toFixed(0)}%`}
                className="mb-3"
              />
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Project:</strong>{" "}
                  <a href="#" onClick={() => navigate(`/projects/${project?.id}`)}>
                    {project?.name || "Unknown"}
                  </a>
                </Col>
                <Col md={6}>
                  <strong>Assigned To:</strong> {assignedUser?.name || "Unassigned"}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Start Date:</strong>{" "}
                  {task.start_date
                    ? new Date(task.start_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })
                    : "N/A"}
                </Col>
                <Col md={6}>
                  <strong>Due Date:</strong>{" "}
                  {task.due_date
                    ? new Date(task.due_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })
                    : "N/A"}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Created:</strong>{" "}
                  {new Date(task.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </Col>
                <Col md={6}>
                  <strong>Updated:</strong>{" "}
                  {new Date(task.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h5>Description</h5>
            </Card.Header>
            <Card.Body>
              {task.description ? (
                <p style={{ whiteSpace: "pre-wrap" }}>{task.description}</p>
              ) : (
                <p className="text-muted">No description provided.</p>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card>
            <Card.Header>
              <h5>Quick Actions</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                {(hasPermission(PERMISSIONS.TASK_EDIT) ||
                  task.assigned_to === user?.id) && (
                  <Button variant="outline-primary" onClick={openEditModal}>
                    {hasPermission(PERMISSIONS.TASK_EDIT) ? "Update Status & Progress" : "Update Status"}
                  </Button>
                )}
                {task.assigned_to === user?.id && task.status === "DONE" && task.approval_status === "NONE" && (
                  <Button variant="outline-info" onClick={handleRequestApproval}>
                    Request Approval
                  </Button>
                )}
                {hasPermission(PERMISSIONS.TASK_APPROVE) && task.approval_status === "PENDING" && (
                  <>
                    <Button variant="outline-success" onClick={handleApproveTask}>
                      Approve Task
                    </Button>
                    <Button variant="outline-danger" onClick={handleRejectTask}>
                      Reject Task
                    </Button>
                  </>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Edit Task Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{!hasPermission(PERMISSIONS.TASK_EDIT) ? "Update Task Status" : "Edit Task"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingTask && (
            <Form>
              {hasPermission(PERMISSIONS.TASK_EDIT) && (
                <>
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
                        setEditingTask({ ...editingTask, description: e.target.value })
                      }
                      placeholder="Enter task description"
                    />
                  </Form.Group>
                </>
              )}
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={editingTask.status}
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    let newProgress = editingTask.progress;
                    if (hasPermission(PERMISSIONS.TASK_EDIT)) {
                      if (newStatus === "DONE") {
                        newProgress = 100;
                      } else if (newStatus === "TODO") {
                        newProgress = 0;
                      } else if (newStatus === "IN_PROGRESS" && editingTask.progress === 0) {
                        newProgress = 50; // default to 50 if was 0
                      }
                    }
                    setEditingTask({ ...editingTask, status: newStatus, progress: newProgress });
                  }}
                >
                  <option value="TODO">Todo</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="BLOCKED">Blocked</option>
                  <option value="DONE">Done</option>
                  {hasPermission(PERMISSIONS.TASK_EDIT) && <option value="CANCELLED">Cancelled</option>}
                </Form.Select>
              </Form.Group>
              {hasPermission(PERMISSIONS.TASK_EDIT) && (
                <Form.Group className="mb-3">
                  <Form.Label>Progress (%)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={editingTask.progress}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        progress: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </Form.Group>
              )}
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpdateTask}
            disabled={hasPermission(PERMISSIONS.TASK_EDIT) ? !editingTask?.title.trim() : false}
          >
            {hasPermission(PERMISSIONS.TASK_EDIT) ? "Save Changes" : "Update Status"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default TaskDetails;
