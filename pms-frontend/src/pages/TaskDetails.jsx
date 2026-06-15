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
import { tasksAPI, projectsAPI, usersAPI, projectMembersAPI, notificationsAPI, commentsAPI, activityLogsAPI } from "../services/api";
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

  // Subtask state
  const [subtasks, setSubtasks] = useState([]);
  const [showSubtaskModal, setShowSubtaskModal] = useState(false);
  const [editingSubtask, setEditingSubtask] = useState(null);
  const [subtaskForm, setSubtaskForm] = useState({ title: "", description: "", assigned_to: "", status: "TODO" });

  // Comments state
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  // Activity log state
  const [activityLog, setActivityLog] = useState([]);
  const [showActivity, setShowActivity] = useState(false);

  useEffect(() => {
    fetchTaskDetails();
  }, [id]);

  useEffect(() => {
    if (task) {
      fetchSubtasks();
      fetchComments();
    }
  }, [task?.id]);

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

  const fetchSubtasks = async () => {
    try {
      const res = await tasksAPI.getSubtasks(task.id);
      setSubtasks(res.data || []);
    } catch {
      // subtasks section silently fails — non-critical
    }
  };

  const openCreateSubtask = () => {
    setEditingSubtask(null);
    setSubtaskForm({ title: "", description: "", assigned_to: "", status: "TODO" });
    setShowSubtaskModal(true);
  };

  const openEditSubtask = (subtask) => {
    setEditingSubtask(subtask);
    setSubtaskForm({
      title: subtask.title,
      description: subtask.description || "",
      assigned_to: subtask.assigned_to || "",
      status: subtask.status,
    });
    setShowSubtaskModal(true);
  };

  const handleSaveSubtask = async () => {
    try {
      if (editingSubtask) {
        const res = await tasksAPI.update(editingSubtask.id, {
          title: subtaskForm.title,
          description: subtaskForm.description || null,
          assigned_to: subtaskForm.assigned_to ? parseInt(subtaskForm.assigned_to) : null,
          status: subtaskForm.status,
        });
        setSubtasks((prev) => prev.map((s) => (s.id === editingSubtask.id ? res.data : s)));
      } else {
        const res = await tasksAPI.create({
          title: subtaskForm.title,
          description: subtaskForm.description || null,
          project_id: task.project_id,
          parent_task_id: task.id,
          assigned_to: subtaskForm.assigned_to ? parseInt(subtaskForm.assigned_to) : null,
        });
        setSubtasks((prev) => [...prev, res.data]);
      }
      setShowSubtaskModal(false);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save subtask");
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    if (!window.confirm("Delete this subtask?")) return;
    try {
      await tasksAPI.delete(subtaskId);
      setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId));
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete subtask");
    }
  };

  const fetchComments = async () => {
    try {
      const res = await commentsAPI.getAll(task.id);
      setComments(res.data || []);
    } catch {
      // silently fail
    }
  };

  const handlePostComment = async () => {
    if (!commentText.trim()) return;
    setCommentLoading(true);
    try {
      const res = await commentsAPI.create(task.id, commentText.trim());
      setComments((prev) => [...prev, res.data]);
      setCommentText("");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to post comment");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleStartEditComment = (comment) => {
    setEditingComment(comment.id);
    setEditCommentText(comment.content);
  };

  const handleSaveEditComment = async (commentId) => {
    try {
      const res = await commentsAPI.update(task.id, commentId, editCommentText.trim());
      setComments((prev) => prev.map((c) => (c.id === commentId ? res.data : c)));
      setEditingComment(null);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to edit comment");
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await commentsAPI.delete(task.id, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete comment");
    }
  };

  const fetchActivity = async () => {
    try {
      const res = await activityLogsAPI.getByTask(task.id);
      setActivityLog(res.data || []);
      setShowActivity(true);
    } catch {
      // silently fail
    }
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
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

          <Card className="mb-3">
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

          {/* Subtasks */}
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Subtasks ({subtasks.length})</h5>
              {hasPermission(PERMISSIONS.TASK_CREATE) && (
                <Button size="sm" variant="outline-primary" onClick={openCreateSubtask}>
                  + Add Subtask
                </Button>
              )}
            </Card.Header>
            <Card.Body className="p-0">
              {subtasks.length === 0 ? (
                <p className="text-muted p-3 mb-0">No subtasks yet.</p>
              ) : (
                <ul className="list-group list-group-flush">
                  {subtasks.map((sub) => (
                    <li key={sub.id} className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <span
                          className="fw-semibold"
                          style={{ cursor: "pointer", color: "#0d6efd" }}
                          onClick={() => navigate(`/tasks/${sub.id}`)}
                        >
                          {sub.title}
                        </span>
                        <Badge bg={getStatusVariant(sub.status)} className="ms-2" style={{ fontSize: "0.7rem" }}>
                          {getStatusLabel(sub.status)}
                        </Badge>
                        {sub.assigned_to && (
                          <small className="text-muted ms-2">— {getUserName(sub.assigned_to)}</small>
                        )}
                      </div>
                      <div className="d-flex gap-2">
                        {hasPermission(PERMISSIONS.TASK_EDIT) && (
                          <Button size="sm" variant="outline-secondary" onClick={() => openEditSubtask(sub)}>
                            Edit
                          </Button>
                        )}
                        {hasPermission(PERMISSIONS.TASK_DELETE) && (
                          <Button size="sm" variant="outline-danger" onClick={() => handleDeleteSubtask(sub.id)}>
                            Delete
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card.Body>
          </Card>

          {/* Comments */}
          <Card>
            <Card.Header>
              <h5 className="mb-0">Discussion ({comments.length})</h5>
            </Card.Header>
            <Card.Body>
              {/* Comment list */}
              <div style={{ maxHeight: "320px", overflowY: "auto", marginBottom: "16px" }}>
                {comments.length === 0 ? (
                  <p className="text-muted mb-0" style={{ fontSize: "0.87rem" }}>No comments yet. Start the discussion.</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
                      <div style={{
                        width: "32px", height: "32px", borderRadius: "50%",
                        background: "#f1d4c9", color: "#6b2c1f",
                        display: "grid", placeItems: "center", fontWeight: 700,
                        fontSize: "13px", flexShrink: 0,
                      }}>
                        {c.user_initial}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 700, fontSize: "0.82rem" }}>{c.user_name}</span>
                          <span style={{ fontSize: "0.72rem", color: "#aaa" }}>{timeAgo(c.created_at)}</span>
                          {c.user_id === user?.id && (
                            <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
                              <button
                                onClick={() => handleStartEditComment(c)}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: "0.75rem", padding: 0 }}
                              >Edit</button>
                              <button
                                onClick={() => handleDeleteComment(c.id)}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "#dc3545", fontSize: "0.75rem", padding: 0 }}
                              >Delete</button>
                            </div>
                          )}
                        </div>
                        {editingComment === c.id ? (
                          <div style={{ marginTop: "4px" }}>
                            <Form.Control
                              as="textarea"
                              rows={2}
                              value={editCommentText}
                              onChange={(e) => setEditCommentText(e.target.value)}
                              style={{ fontSize: "0.84rem" }}
                            />
                            <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                              <Button size="sm" variant="primary" onClick={() => handleSaveEditComment(c.id)}>Save</Button>
                              <Button size="sm" variant="outline-secondary" onClick={() => setEditingComment(null)}>Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <p style={{ margin: "4px 0 0", fontSize: "0.84rem", color: "#333", whiteSpace: "pre-wrap" }}>{c.content}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              {/* Post comment */}
              <div style={{ display: "flex", gap: "8px" }}>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  style={{ fontSize: "0.84rem", resize: "none" }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handlePostComment();
                  }}
                />
                <Button
                  variant="primary"
                  disabled={commentLoading || !commentText.trim()}
                  onClick={handlePostComment}
                  style={{ alignSelf: "flex-end", whiteSpace: "nowrap" }}
                >
                  {commentLoading ? "..." : "Post"}
                </Button>
              </div>
              <small className="text-muted">Ctrl+Enter to post</small>
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
                {hasPermission(PERMISSIONS.TASK_DELETE) && (
                  <Button variant="outline-danger" onClick={handleDeleteTask}>
                    Delete Task
                  </Button>
                )}
                <Button
                  variant="outline-secondary"
                  onClick={showActivity ? () => setShowActivity(false) : fetchActivity}
                >
                  {showActivity ? "Hide Activity" : "View Activity Log"}
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* Activity Log */}
          {showActivity && (
            <Card className="mt-3">
              <Card.Header>
                <h6 className="mb-0">Activity Log</h6>
              </Card.Header>
              <Card.Body style={{ padding: "12px 16px", maxHeight: "320px", overflowY: "auto" }}>
                {activityLog.length === 0 ? (
                  <p className="text-muted mb-0" style={{ fontSize: "0.84rem" }}>No activity recorded.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {activityLog.map((log) => (
                      <div key={log.id} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                        <div style={{
                          width: "8px", height: "8px", borderRadius: "50%",
                          background: "#E8640A", flexShrink: 0, marginTop: "5px",
                        }} />
                        <div>
                          <span style={{ fontSize: "0.82rem", color: "#333" }}>
                            <strong>{log.performed_by_name || `User #${log.performed_by}`}</strong>{" "}
                            {log.action?.replace(/_/g, " ")}
                          </span>
                          <div style={{ fontSize: "0.72rem", color: "#aaa" }}>
                            {new Date(log.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* Subtask Modal */}
      <Modal show={showSubtaskModal} onHide={() => setShowSubtaskModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingSubtask ? "Edit Subtask" : "Add Subtask"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Title <span className="text-danger">*</span></Form.Label>
              <Form.Control
                value={subtaskForm.title}
                onChange={(e) => setSubtaskForm({ ...subtaskForm, title: e.target.value })}
                placeholder="Subtask title"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={subtaskForm.description}
                onChange={(e) => setSubtaskForm({ ...subtaskForm, description: e.target.value })}
                placeholder="Optional description"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Assign To</Form.Label>
              <Form.Select
                value={subtaskForm.assigned_to}
                onChange={(e) => setSubtaskForm({ ...subtaskForm, assigned_to: e.target.value })}
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
            {editingSubtask && (
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={subtaskForm.status}
                  onChange={(e) => setSubtaskForm({ ...subtaskForm, status: e.target.value })}
                >
                  <option value="TODO">Todo</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="BLOCKED">Blocked</option>
                  <option value="DONE">Done</option>
                </Form.Select>
              </Form.Group>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSubtaskModal(false)}>Cancel</Button>
          <Button
            variant="primary"
            onClick={handleSaveSubtask}
            disabled={!subtaskForm.title.trim()}
          >
            {editingSubtask ? "Save Changes" : "Create Subtask"}
          </Button>
        </Modal.Footer>
      </Modal>

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
