import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Container, Card, Form, Button, Alert } from "react-bootstrap";
import { authAPI } from "../services/api";

function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    job_title: "",
    department: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password validation
  const validatePassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      setError("Name, email, and password are required");
      return;
    }

    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!validatePassword(formData.password)) {
      setError("Password must be at least 8 characters with uppercase, lowercase, and a number");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Password does not match");
      return;
    }

    setLoading(true);

    try {
      // Use auth signup endpoint (not usersAPI)
      const response = await authAPI.signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        job_title: formData.job_title || null,
        department: formData.department || null,
      });

      // Auto login after signup
      const loginResult = await authAPI.login(formData.email, formData.password);
      const { access_token, permissions } = loginResult.data;
      
      localStorage.setItem("token", access_token);
      if (permissions) {
        localStorage.setItem("permissions", JSON.stringify(permissions));
      }
      
      // Get user info
      const userResponse = await authAPI.getCurrentUser();
      const userData = userResponse.data;
      
      localStorage.setItem("user", JSON.stringify(userData));
      
      // Redirect to dashboard
      navigate("/");
    } catch (error) {
      console.error("Signup error:", error);
      const errorMessage = error.response?.data?.detail || 
        error.response?.data?.message ||
        "Failed to create account. Email might already be registered.";
      setError(errorMessage);
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
            <p className="text-muted">Create your account</p>
            <p className="text-muted small">All new users are assigned as Members</p>
          </Card.Title>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Full Name *</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter your name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email *</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
              <Form.Text className="text-muted">
                We'll check if this email is already registered
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Job Title (Optional)</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., Developer, Designer"
                value={formData.job_title}
                onChange={(e) =>
                  setFormData({ ...formData, job_title: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Department (Optional)</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., Engineering, Design"
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password *</Form.Label>
              <div className="d-flex">
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 8 chars: uppercase, lowercase, number"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  minLength={8}
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                  className="ms-2"
                >
                  {showPassword ? "Hide" : "Show"}
                </Button>
              </div>
              <Form.Text className="text-muted">
                Must contain uppercase, lowercase, and a number
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Confirm Password *</Form.Label>
              <div className="d-flex">
                <Form.Control
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  required
                  isInvalid={
                    formData.confirmPassword.length > 0 &&
                    formData.password !== formData.confirmPassword
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
              {loading ? "Creating Account..." : "Sign Up"}
            </Button>
          </Form>

          <div className="text-center mt-3">
            <p className="text-muted">
              Already have an account?{" "}
              <Link to="/login">Sign in</Link>
            </p>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Signup;
