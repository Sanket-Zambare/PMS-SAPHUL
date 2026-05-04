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
import { usePermissions } from "../hooks/usePermissions";
import { PERMISSIONS, isClient } from "../utils/permissions";
import {
  projectsAPI,
  tasksAPI,
  projectMembersAPI,
  usersAPI,
  activityLogsAPI,
  dashboardAPI,
  invitationsAPI,
  filesAPI,
} from "../services/api";

function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
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
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assigned_to: "",
    due_date: "",
  });
  const [inviteEmail, setInviteEmail] = useState("");
  const [files, setFiles] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    version: "",
    is_latest: true,
  });

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      const promises = [
        projectsAPI.getById(projectId),
        tasksAPI.getAll({ project_id: projectId }),
        projectMembersAPI.getByProject(projectId),
        usersAPI.getAll(), // Always fetch users for member display
      ];

      if (!isClient(user)) {
        promises.push(activityLogsAPI.getByProject(projectId, 0, 20));
        promises.push(dashboardAPI.getProjectStats(projectId));
        promises.push(filesAPI.getAll({ project_id: projectId }));
      }

      const results = await Promise.all(promises);

      const projectRes = results[0];
      const tasksRes = results[1];
      const membersRes = results[2];
      const usersRes = results[3];
      let logsRes = { data: [] };
      let statsRes = null;

      let filesRes = { data: [] };

      if (!isClient(user)) {
        logsRes = results[4];
        statsRes = results[5];
        filesRes = results[6];
      }

      setProject(projectRes.data);
      setTasks(tasksRes.data);
      setMembers(membersRes.data);
      setUsers(usersRes.data);
      setActivityLogs(logsRes.data);
      setStats(statsRes?.data || null);
      setFiles(filesRes.data || []);
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

  const handleInviteClient = async () => {
    try {
      await invitationsAPI.invite({
        email: inviteEmail,
        project_id: projectId,
      });
      setShowInviteModal(false);
      setInviteEmail("");
      alert("Invitation sent successfully.");
    } catch (error) {
      alert("Failed to send invitation.");
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (window.confirm("Are you sure you want to delete this file?")) {
      try {
        await filesAPI.delete(fileId);
        setFiles(files.filter((f) => f.id !== fileId));
      } catch (error) {
        setError(error.response?.data?.detail || "Failed to delete file");
      }
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file to upload");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('project_id', String(projectId)); // Ensure it's a string for FormData
      // Don't send task_id if not specified (let backend use default None)
      formData.append('version', uploadForm.version || '1.0');
      formData.append('is_latest', String(uploadForm.is_latest)); // Convert boolean to string

      const response = await filesAPI.create(formData);
      setFiles([...files, response.data]);
      setShowUploadModal(false);
      setSelectedFile(null);
      setUploadForm({ version: "", is_latest: true });
      setError(""); // Clear any previous errors
    } catch (error) {
      console.error("File upload error:", error);
      let errorMessage = "Failed to upload file";

      if (error.response) {
        // Server responded with error status
        if (error.response.status === 422) {
          errorMessage = "Invalid file upload data. Please check all fields.";
        } else if (error.response.status === 403) {
          errorMessage = "You don't have permission to upload files.";
        } else if (error.response.status === 404) {
          errorMessage = "Project not found.";
        } else if (error.response.data?.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        // Network error
        errorMessage = "Network error. Please check your connection.";
      }

      setError(errorMessage);
      // Don't close modal on error so user can retry
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
              {hasPermission(PERMISSIONS.PROJECT_APPROVE) &&
                project.status === "COMPLETED" &&
                project.review_status === "PENDING" &&
                !isClient(user) && (
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

          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Project Members</Card.Title>
              {members.length === 0 ? (
                <p className="text-muted">No members assigned to this project</p>
              ) : (
                <div>
                  {members.map((member) => {
                    const memberUser = users.find(u => u.id === member.user_id);
                    return (
                      <div key={member.id} className="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
                        <div>
                          <strong>{memberUser ? memberUser.name : `User ${member.user_id}`}</strong>
                          <br />
                          <small className="text-muted">{memberUser ? memberUser.email : ''}</small>
                        </div>
                        <Badge bg={memberUser && memberUser.roles && memberUser.roles.includes("CLIENT") ? 'secondary' : (member.role === 'PROJECT_MANAGER' ? 'warning' : 'secondary')}>
                          {memberUser && memberUser.roles && memberUser.roles.includes("CLIENT") ? 'Client' : member.role}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
              {hasPermission(PERMISSIONS.USER_CREATE) && (
                <Button variant="primary" className="mt-3" onClick={() => setShowInviteModal(true)}>
                  Invite Client
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
          <Card className="mb-3">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <Card.Title>Tasks</Card.Title>
                {hasPermission(PERMISSIONS.TASK_CREATE) && !isClient(user) && (
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
                            task.assigned_to === user?.id) && !isClient(user) && (
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
                            user?.role === "PROJECT_MANAGER") && !isClient(user) && (
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

          {!isClient(user) && (
            <Card>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <Card.Title>Project Files</Card.Title>
                  {hasPermission(PERMISSIONS.FILE_UPLOAD) && (
                    <Button onClick={() => setShowUploadModal(true)}>
                      Upload File
                    </Button>
                  )}
                </div>
                {files.length === 0 ? (
                  <p className="text-muted">No files uploaded for this project yet.</p>
                ) : (
                  <Table bordered hover responsive>
                    <thead>
                      <tr>
                        <th>File Name</th>
                        <th>Version</th>
                        <th>Uploaded By</th>
                        <th>Upload Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {files.map((file) => (
                        <tr key={file.id}>
                          <td>{file.file_name}</td>
                          <td>{file.version}</td>
                          <td>{getUserName(file.uploaded_by)}</td>
                          <td>{new Date(file.created_at).toLocaleDateString()}</td>
                          <td>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-2"
                              onClick={() => {
                                /*
                                =========================
                                ==== PRODUCTION (HOSTINGER) ====
                                Uncomment this for production
                                =========================
                                */
                                // const fileDownloadUrl = `https://api.yourdomain.com${file.file_url}`;
                                
                                /*
                                =========================
                                ==== LOCAL (REMOVE FOR PROD) ====
                                REMOVE OR COMMENT THIS FOR PRODUCTION
                                =========================
                                */
                                const fileDownloadUrl = `http://localhost:8000${file.file_url}`;
                                
                                window.open(fileDownloadUrl, '_blank');
                              }}
                            >
                              Download
                            </Button>
                            {hasPermission(PERMISSIONS.FILE_DELETE) && (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDeleteFile(file.id)}
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
          )}
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

      {/* Invite Client Modal */}
      <Modal show={showInviteModal} onHide={() => setShowInviteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Invite Client</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Enter client email"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowInviteModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleInviteClient}
            disabled={!inviteEmail.trim()}
          >
            Send Invitation
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Upload File Modal */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Upload File</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Select File</Form.Label>
              <Form.Control
                type="file"
                onChange={(e) => setSelectedFile(e.target.files[0])}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Version</Form.Label>
              <Form.Control
                type="text"
                value={uploadForm.version}
                onChange={(e) => setUploadForm({ ...uploadForm, version: e.target.value })}
                placeholder="e.g., 1.0, 2.1"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Mark as latest version"
                checked={uploadForm.is_latest}
                onChange={(e) => setUploadForm({ ...uploadForm, is_latest: e.target.checked })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUploadModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleFileUpload}
            disabled={!selectedFile}
          >
            Upload File
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default ProjectDetails;
