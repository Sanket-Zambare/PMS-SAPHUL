import { useState, useEffect } from "react";
import Container from "react-bootstrap/Container";
import Table from "react-bootstrap/Table";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import { useAuth } from "../context/AuthContext";
import { usePermissions } from "../hooks/usePermissions";
import { adminUsersAPI } from "../services/api";
import { PERMISSIONS } from "../utils/permissions";

function Users() {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await adminUsersAPI.getAll();
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setError("Failed to load users");
    } finally {
      setLoading(false);
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
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
}

export default Users;
