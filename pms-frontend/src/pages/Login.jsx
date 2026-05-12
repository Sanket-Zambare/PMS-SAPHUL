import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Form, Button, Alert } from "react-bootstrap";
import { authAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Check if email exists (before login attempt)
  const checkEmailExists = async (email) => {
    if (!validateEmail(email)) {
      return null;
    }
    
    try {
      setCheckingEmail(true);
      // We'll add an endpoint to check email, for now we'll handle it in login
      // This is a placeholder - actual check happens during login
      return true;
    } catch (error) {
      return false;
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Email and password are required");
      return;
    }

    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        navigate("/");
      } else {
        setError(result.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      let errorMessage = "Login failed";
      
      if (error.response?.status === 401) {
        errorMessage = "Incorrect email or password. Please check your credentials.";
      } else if (error.response?.status === 403) {
        errorMessage = "Your account is inactive. Please contact administrator.";
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.code === "ECONNREFUSED" || error.message.includes("Network Error")) {
        /*
        =========================
        ==== PRODUCTION (HOSTINGER) ====
        Update error message for production
        =========================
        */
        // PRODUCTION error message (uncomment for production):
        // errorMessage = "Cannot connect to server. Please check your connection.";
        
        /*
        =========================
        ==== LOCAL (REMOVE FOR PROD) ====
        REMOVE OR COMMENT THIS FOR PRODUCTION
        =========================
        */
        errorMessage = "Cannot connect to server. Please ensure the backend is running on http://localhost:8000";  // LOCAL ONLY
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card-shell">
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

        <p className="text-muted text-center mb-4">Sign in to your account</p>

        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                setError(""); // Clear error when user types
              }}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <div className="d-flex">
              <Form.Control
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  setError("");
                }}
                required
              />
              <Button
                variant="outline-secondary"
                onClick={() => setShowPassword(!showPassword)}
                className="ms-2"
              >
                {showPassword ? "Hide" : "Show"}
              </Button>
            </div>
            <div className="text-end mt-2">
              <Link to="/forgot-password" className="text-decoration-none">
                Forgot password?
              </Link>
            </div>
          </Form.Group>

          <Button
            variant="primary"
            type="submit"
            className="w-100"
            disabled={loading || checkingEmail}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </Form>

        <div className="text-center mt-3">
          <p className="text-muted mb-2">
            Don&apos;t have an account?{" "}
            <Link to="/signup">Sign up</Link>
          </p>
          <p className="text-muted small mb-0">
            <Link to="/welcome" className="text-decoration-none">
              Back to welcome
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
