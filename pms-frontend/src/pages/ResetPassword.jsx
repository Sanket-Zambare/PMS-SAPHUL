import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Container, Card, Form, Button, Alert } from "react-bootstrap";
import { authAPI } from "../services/api";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState("");

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError("Reset link is invalid or expired");
    }
  }, [searchParams]);

  const validatePassword = (password) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!newPassword || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (!validatePassword(newPassword)) {
      setError("Password must be at least 8 characters with uppercase, lowercase, and a number");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!token) {
      setError("Reset link is invalid or expired");
      return;
    }

    setLoading(true);

    try {
      await authAPI.resetPassword(token, newPassword);
      setSuccess("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      setError("Reset link is invalid or expired");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: "100vh" }}
    >
      <Card style={{ width: "400px" }}>
        <Card.Body>
          <Card.Title className="text-center mb-4">
            <h2>SAPHUL PMS</h2>
            <p className="text-muted">Reset Password</p>
          </Card.Title>

          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>New Password</Form.Label>
              <div className="d-flex">
                <Form.Control
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Min 8 chars: uppercase, lowercase, number"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError("");
                  }}
                  required
                  minLength={8}
                />
                <Button
                  variant="outline-secondary"
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="ms-2"
                >
                  {showNewPassword ? "👁️" : "🙈"}
                </Button>
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Confirm New Password</Form.Label>
              <div className="d-flex">
                <Form.Control
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError("");
                  }}
                  required
                  isInvalid={
                    confirmPassword.length > 0 &&
                    newPassword !== confirmPassword
                  }
                />
                <Button
                  variant="outline-secondary"
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="ms-2"
                >
                  {showConfirmPassword ? "👁️" : "🙈"}
                </Button>
              </div>
              <Form.Control.Feedback type="invalid">
                Passwords do not match
              </Form.Control.Feedback>
            </Form.Group>

            <Button
              variant="primary"
              type="submit"
              className="w-100"
              disabled={loading || !token}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </Form>

          <div className="text-center mt-3">
            <a href="/login" className="text-decoration-none">
              Back to Login
            </a>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default ResetPassword;
