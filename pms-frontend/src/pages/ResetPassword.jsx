import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Form, Button, Alert } from "react-bootstrap";
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
    <div
      style={{
        minHeight: "100vh",
        background: "#F5F4F0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#fff",
          borderRadius: "20px",
          padding: "2.5rem 2rem",
          boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
          border: "1px solid #e8e8e8",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h2
            style={{
              fontWeight: 800,
              letterSpacing: "0.15em",
              color: "#1a1a1a",
              marginBottom: "0.2rem",
            }}
          >
            S.A.N.E
          </h2>
          <p
            style={{
              fontSize: "0.72rem",
              color: "#888",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            Stop All Needless Effort
          </p>
        </div>

        <p className="text-muted text-center mb-4">Reset Password</p>

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
          <Link to="/login" className="text-decoration-none">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
