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
import { PERMISSIONS, isClient } from "../utils/permissions";

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

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [roleChangeInfo, setRoleChangeInfo] = useState("");

  useEffect(() => {
    fetchUsers();
    fetchProjects();
  }, []);

  useEffect(() => {
    // Filter users based on search term
    if (searchTerm.trim() === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [users, searchTerm]);

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
      const results = await Promise.all(
        usersList.map((u) =>
          projectMembersAPI.getByUser(u.id).then((r) => [u.id, r.data]).catch(() => [u.id, []])
        )
      );
      setUserProjects(Object.fromEntries(results));
    } catch (error) {
      console.error("Failed to fetch user projects:", error);
    }
  };

  // Derive primary role string from roles array
  const getPrimaryRole = (u) => {
    const roles = u.roles || [];
    if (roles.includes("ADMIN")) return "ADMIN";
    if (roles.includes("PROJECT_MANAGER")) return "PROJECT_MANAGER";
    if (roles.includes("CLIENT")) return "CLIENT";
    return "MEMBER";
  };

  const updateUserRoles = (userId, newRole) => {
    setUsers(users.map((u) =>
      u.id === userId ? { ...u, roles: [newRole] } : u
    ));
  };

  const showReloginWarning = (name) => {
    setRoleChangeInfo(`Role updated for ${name}. Ask them to log out and back in for changes to take effect.`);
    setTimeout(() => setRoleChangeInfo(""), 8000);
  };

  const handlePromoteToPM = async (u) => {
    try {
      await adminUsersAPI.promoteToPM(u.id);
      updateUserRoles(u.id, "PROJECT_MANAGER");
      setError("");
      showReloginWarning(u.name);
    } catch (error) {
      setError(error.response?.data?.detail || "Failed to promote user");
    }
  };

  const handleDemoteToMember = async (u) => {
    try {
      await adminUsersAPI.demoteToMember(u.id);
      updateUserRoles(u.id, "MEMBER");
      setError("");
      showReloginWarning(u.name);
    } catch (error) {
      setError(error.response?.data?.detail || "Failed to demote user");
    }
  };

  const handleMakeAdmin = async (u) => {
    if (!window.confirm(`Make ${u.name} an Admin? They will have full access.`)) return;
    try {
      await adminUsersAPI.makeAdmin(u.id);
      updateUserRoles(u.id, "ADMIN");
      setError("");
      showReloginWarning(u.name);
    } catch (error) {
      setError(error.response?.data?.detail || "Failed to make admin");
    }
  };

  const handleRemoveAdmin = async (u) => {
    if (!window.confirm(`Remove admin access from ${u.name}? They will become a Member.`)) return;
    try {
      await adminUsersAPI.removeAdmin(u.id);
      updateUserRoles(u.id, "MEMBER");
      setError("");
      showReloginWarning(u.name);
    } catch (error) {
      setError(error.response?.data?.detail || "Failed to remove admin");
    }
  };

  const handleDeactivate = async (u) => {
    if (!window.confirm(`Deactivate ${u.name}? They won't be able to log in.`)) return;
    try {
      await adminUsersAPI.deactivate(u.id);
      setUsers(users.map((usr) => usr.id === u.id ? { ...usr, status: "INACTIVE" } : usr));
      setError("");
    } catch (error) {
      setError(error.response?.data?.detail || "Failed to deactivate user");
    }
  };

  const handleActivate = async (u) => {
    try {
      await adminUsersAPI.activate(u.id);
      setUsers(users.map((usr) => usr.id === u.id ? { ...usr, status: "ACTIVE" } : usr));
      setError("");
    } catch (error) {
      setError(error.response?.data?.detail || "Failed to activate user");
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

  const handleRemoveFromProject = async (memberId) => {
    if (!window.confirm("Are you sure you want to remove this user from the project?")) {
      return;
    }

    try {
      await projectMembersAPI.remove(memberId);
      setError("");
      // Refresh user projects data
      await fetchUserProjects(users);
    } catch (error) {
      setError(error.response?.data?.detail || "Failed to remove user from project");
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

      {/* Search Bar */}
      <div className="mb-3">
        <Form.Control
          type="text"
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {roleChangeInfo && (
        <Alert variant="warning" dismissible onClose={() => setRoleChangeInfo("")}>
          ⚠️ {roleChangeInfo}
        </Alert>
      )}

      <Table bordered hover responsive>
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Status</th>
            <th>Email</th>
            {canManageRoles && !isClient(user) && <th>Role Management</th>}
            <th>Project Assignment</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>
                <Badge bg={getRoleVariant(getPrimaryRole(u))}>
                  {getPrimaryRole(u)}
                </Badge>
              </td>
              <td>
                <Badge bg={u.status === "ACTIVE" ? "success" : "danger"}>
                  {u.status}
                </Badge>
              </td>
              <td>{u.email}</td>
              {canManageRoles && !isClient(user) && (
                <td>
                  {u.id === user?.id ? (
                    <small className="text-muted">You</small>
                  ) : (() => {
                    const role = getPrimaryRole(u);
                    return (
                      <div className="d-flex flex-wrap gap-1">
                        {role === "MEMBER" && (
                          <>
                            <Button size="sm" variant="outline-primary" onClick={() => handlePromoteToPM(u)}>→ PM</Button>
                            <Button size="sm" variant="outline-danger" onClick={() => handleMakeAdmin(u)}>→ Admin</Button>
                          </>
                        )}
                        {role === "PROJECT_MANAGER" && (
                          <>
                            <Button size="sm" variant="outline-secondary" onClick={() => handleDemoteToMember(u)}>→ Member</Button>
                            <Button size="sm" variant="outline-danger" onClick={() => handleMakeAdmin(u)}>→ Admin</Button>
                          </>
                        )}
                        {role === "ADMIN" && (
                          <Button size="sm" variant="outline-secondary" onClick={() => handleRemoveAdmin(u)}>→ Member</Button>
                        )}
                        {role === "CLIENT" && <small className="text-muted">Client</small>}
                        <Button
                          size="sm"
                          variant={u.status === "ACTIVE" ? "outline-dark" : "outline-success"}
                          onClick={() => u.status === "ACTIVE" ? handleDeactivate(u) : handleActivate(u)}
                        >
                          {u.status === "ACTIVE" ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    );
                  })()}
                </td>
              )}
              {canManageRoles && isClient(user) && <td></td>}
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
                        <div key={assignment.id} className="mb-1 d-flex align-items-center">
                          <Badge bg="info" className="me-1">
                            {project ? project.name : `Project ${assignment.project_id}`}
                          </Badge>
                          <small className="me-2">({assignment.role})</small>
                          {!(userProjects[u.id] && userProjects[u.id].find(a => a.id === assignment.id) && users.find(us => us.id === u.id)?.roles?.includes("CLIENT")) && (
                            <Button
                              size="sm"
                              variant="outline-danger"
                              className="btn-sm py-0 px-1"
                              onClick={() => handleRemoveFromProject(assignment.id)}
                              title="Remove from project"
                            >
                              ×
                            </Button>
                          )}
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
