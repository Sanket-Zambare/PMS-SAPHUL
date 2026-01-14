import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Container, Card, Form, Button, Alert } from "react-bootstrap";
import { authAPI } from "../services/api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState("request"); // "request" or "reset"
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/.test(password);
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.forgotPassword(email);
      setSuccess(response.data.message || "Password reset link sent to your email");
      // Store token internally (do not show in UI)
      if (response.data.token) {
        setResetToken(response.data.token);
        setStep("reset");
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      setError(error.response?.data?.detail || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!resetToken || !newPassword || !confirmPassword) {
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

    setLoading(true);

    try {
      const response = await authAPI.resetPassword(resetToken, newPassword);
      setSuccess("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (error) {
      console.error("Reset password error:", error);
      setError(error.response?.data?.detail || "Failed to reset password");
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
            <p className="text-muted">
              {step === "request" ? "Forgot Password" : "Reset Password"}
            </p>
          </Card.Title>

          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          {step === "request" ? (
            <Form onSubmit={handleRequestReset}>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  required
                />
                <Form.Text className="text-muted">
                  We'll send a password reset link to this email
                </Form.Text>
              </Form.Group>

              <Button
                variant="primary"
                type="submit"
                className="w-100"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </Form>
          ) : (
            <Form onSubmit={handleResetPassword}>
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
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="ms-2"
                  >
                    {showNewPassword ? "Hide" : "Show"}
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
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="ms-2"
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </Button>
                </div>
                <Form.Control.Feedback type="invalid">
                  Password does not match
                </Form.Control.Feedback>
              </Form.Group>

              <Button
                variant="primary"
                type="submit"
                className="w-100"
                disabled={loading}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
            </Form>
          )}

          <div className="text-center mt-3">
            <Link to="/login" className="text-decoration-none">
              Back to Login
            </Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default ForgotPassword;

