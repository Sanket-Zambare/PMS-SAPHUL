import { useState } from "react";
import { Link } from "react-router-dom";
import { Container, Card, Form, Button, Alert } from "react-bootstrap";
import { authAPI } from "../services/api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
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
      await authAPI.forgotPassword(email);
      setSuccess("If an account with this email exists, a password reset link has been sent.");
    } catch (error) {
      // Do not reveal backend errors
      setSuccess("If an account with this email exists, a password reset link has been sent.");
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
            <p className="text-muted">Forgot Password</p>
          </Card.Title>

          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Form onSubmit={handleSubmit}>
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

