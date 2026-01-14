import { useState, useEffect } from "react";
import Container from "react-bootstrap/Container";
import Table from "react-bootstrap/Table";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import { useAuth } from "../context/AuthContext";
import { usePermissions } from "../hooks/usePermissions";
import { adminUsersAPI, projectsAPI, projectMembersAPI } from "../services/api";
import { PERMISSIONS } from "../utils/permissions";

function Users() {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [userProjects, setUserProjects] = useState({}); // userId -> array of project assignments
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [assignmentData, setAssignmentData] = useState({
    project_id: "",
    role: "MEMBER"
  });

  useEffect(() => {
    fetchUsers();
    fetchProjects();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await adminUsersAPI.getAll();
      setUsers(response.data);
      // Fetch project assignments for all users
      await fetchUserProjects(response.data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await projectsAPI.getAll();
      setProjects(response.data);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  };

  const fetchUserProjects = async (usersList) => {
    try {
      const userProjectsMap = {};
      for (const user of usersList) {
        try {
          const response = await projectMembersAPI.getByUser(user.id);
          userProjectsMap[user.id] = response.data;
        } catch (error) {
          console.error(`Failed to fetch projects for user ${user.id}:`, error);
          userProjectsMap[user.id] = [];
        }
      }
      setUserProjects(userProjectsMap);
    } catch (error) {
      console.error("Failed to fetch user projects:", error);
    }
  };

  const handlePromoteToPM = async (userId) => {
    try {
      await adminUsersAPI.promoteToPM(userId);
      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, role: "PROJECT_MANAGER" } : u
        )
      );
      setError("");
    } catch (error) {
      setError(error.response?.data?.detail || "Failed to promote user");
    }
  };

  const handleDemoteToMember = async (userId) => {
    try {
      await adminUsersAPI.demoteToMember(userId);
      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, role: "MEMBER" } : u
        )
      );
      setError("");
    } catch (error) {
      setError(error.response?.data?.detail || "Failed to demote user");
    }
  };

  const handleAssignToProject = async () => {
    try {
      await projectMembersAPI.add({
        project_id: parseInt(assignmentData.project_id),
        user_id: selectedUser.id,
        role: assignmentData.role
      });
      setShowAssignModal(false);
      setSelectedUser(null);
      setAssignmentData({ project_id: "", role: "MEMBER" });
      setError("");
      // Refresh user projects data
      await fetchUserProjects(users);
    } catch (error) {
      setError(error.response?.data?.detail || "Failed to assign user to project");
    }
  };

  const openAssignModal = (user) => {
    setSelectedUser(user);
    setShowAssignModal(true);
  };

  const getRoleVariant = (role) => {
    if (role === "ADMIN") return "primary";
    if (role === "PROJECT_MANAGER") return "warning";
    return "secondary";
  };

  if (loading) {
    return (
      <Container fluid className="mt-3">
        <div>Loading...</div>
      </Container>
    );
  }

  if (!hasPermission(PERMISSIONS.USER_VIEW_ALL)) {
    return (
      <Container fluid className="mt-3">
        <Alert variant="warning">You don't have permission to view this page.</Alert>
      </Container>
    );
  }

  const canManageRoles = hasPermission(PERMISSIONS.USER_MANAGE_ROLES);

  return (
    <Container fluid className="mt-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1>Users</h1>
          <p className="text-muted">Admin can manage roles</p>
        </div>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Table bordered hover responsive>
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Status</th>
            <th>Email</th>
            {canManageRoles && <th>Role Management</th>}
            <th>Project Assignment</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>
                <Badge bg={getRoleVariant(u.role)}>{u.role}</Badge>
              </td>
              <td>
                <Badge bg={u.status === "ACTIVE" ? "success" : "danger"}>
                  {u.status}
                </Badge>
              </td>
              <td>{u.email}</td>
              {canManageRoles && (
                <td>
                  {u.role === "MEMBER" && (
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => handlePromoteToPM(u.id)}
                    >
                      Promote to PM
                    </Button>
                  )}
                  {u.role === "PROJECT_MANAGER" && (
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      onClick={() => handleDemoteToMember(u.id)}
                    >
                      Demote to Member
                    </Button>
                  )}
                </td>
              )}
              <td>
                <div className="mb-2">
                  <Button
                    size="sm"
                    variant="outline-success"
                    onClick={() => openAssignModal(u)}
                  >
                    Assign to Project
                  </Button>
                </div>
                {userProjects[u.id] && userProjects[u.id].length > 0 && (
                  <div>
                    <small className="text-muted">Current Projects:</small>
                    {userProjects[u.id].map((assignment) => {
                      const project = projects.find(p => p.id === assignment.project_id);
                      return (
                        <div key={assignment.id} className="mb-1">
                          <Badge bg="info" className="me-1">
                            {project ? project.name : `Project ${assignment.project_id}`}
                          </Badge>
                          <small>({assignment.role})</small>
                        </div>
                      );
                    })}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Assign to Project Modal */}
      <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Assign User to Project</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <div className="mb-3">
              <p><strong>User:</strong> {selectedUser.name} ({selectedUser.email})</p>
            </div>
          )}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Project</Form.Label>
              <Form.Select
                value={assignmentData.project_id}
                onChange={(e) =>
                  setAssignmentData({ ...assignmentData, project_id: e.target.value })
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
              <Form.Label>Role in Project</Form.Label>
              <Form.Select
                value={assignmentData.role}
                onChange={(e) =>
                  setAssignmentData({ ...assignmentData, role: e.target.value })
                }
              >
                <option value="MEMBER">Member</option>
                <option value="PROJECT_MANAGER">Project Manager</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAssignModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAssignToProject}
            disabled={!assignmentData.project_id}
          >
            Assign User
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default Users;
