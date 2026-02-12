import { useEffect, useState } from "react";
import { Container, Card, Form, Button, Alert, Badge } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import apiClient from "../../../api/client";
import { clearAuth, isAuthenticated, setAuth } from "../../../utils/auth";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({
    email: "",
    password: "",
    otp: "",
    remember: false,
  });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const redirectTo = location.state?.from?.pathname || "/";

  useEffect(() => {
    if (isAuthenticated()) {
      navigate(redirectTo, { replace: true });
    }
  }, [navigate, redirectTo]);

  // Hide the navbar on the login page
  useEffect(() => {
    const nav = document.querySelector(".nav-shell");
    const prevDisplay = nav?.style.display;
    if (nav) nav.style.display = "none";
    return () => {
      if (nav) nav.style.display = prevDisplay || "";
    };
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    clearAuth();
    apiClient
      .post("/auth/login", {
        email: form.email,
        password: form.password,
        otp: form.otp,
      })
      .then((res) => {
        setAuth(res.data.token, res.data.user);
        navigate(redirectTo, { replace: true });
      })
      .catch((err) => {
        console.error(err);
        const code = err.response?.data?.error;
        const provision = err.response?.data?.totp_secret;
        const otpauth = err.response?.data?.otpauth_url;
        const msg =
          code === "otp_required"
            ? "Enter a 6-digit code from your authenticator app."
            : code === "invalid_otp"
            ? "Invalid authenticator code."
            : err.response?.data?.error || "Invalid credentials";
        setStatus({
          variant: "danger",
          message: msg + (provision ? ` Secret: ${provision}` : ""),
          otpauth,
        });
      })
      .finally(() => setLoading(false));
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
      <Card className="shadow-lg border-0 bg-dark text-light rounded-4" style={{ maxWidth: 480, width: "100%" }}>
        <Card.Body className="p-4">
          <div className="text-center mb-4">
            <div className="d-inline-flex align-items-center justify-content-center mb-2" style={{
              width: 50,
              height: 50,
              borderRadius: 14,
              background: "linear-gradient(135deg, #1f2937, #0f172a)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.35)"
            }}>
              <i className="bi bi-shield-lock-fill fs-5 text-info"></i>
            </div>
            <h4 className="mb-1">Secure Login</h4>
            <small className="text-muted">2FA and verification required</small>
          </div>

          {status && (
            <Alert variant={status.variant}>
              {status.message}
              {status.otpauth && (
                <div className="small mt-2">
                  Scan in Authenticator: <code>{status.otpauth}</code>
                </div>
              )}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="text-light">Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@company.com"
                className="bg-dark text-light"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="text-light">Password</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="bg-dark text-light"
                required
              />
            </Form.Group>

            <div className="bg-body-secondary bg-opacity-10 rounded-3 p-3 mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                  <Form.Label className="text-light mb-0">Hardware/Authenticator Code</Form.Label>
                  <small className="text-muted d-block">Enter a fresh 6-digit code from Microsoft/Google Authenticator.</small>
                </div>
                <Badge bg="info" text="dark">Required</Badge>
              </div>
              <Form.Group className="mt-3">
                <Form.Control
                  type="text"
                  name="otp"
                  value={form.otp}
                  onChange={handleChange}
                  placeholder="Enter 6-digit code"
                  className="bg-dark text-light"
                  maxLength={6}
                  required
                />
              </Form.Group>
            </div>

            <Form.Check
              type="checkbox"
              id="remember"
              name="remember"
              label="Remember this device for 30 days"
              checked={form.remember}
              onChange={handleChange}
              className="text-light mb-3"
            />

            <Button variant="info" type="submit" className="w-100" disabled={loading}>
              {loading ? "Signing in..." : "Sign In Securely"}
            </Button>
            <div className="text-center mt-3">
              <small className="text-muted">
                Authorized personnel only. Access monitored & logged.
              </small>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default LoginPage;
