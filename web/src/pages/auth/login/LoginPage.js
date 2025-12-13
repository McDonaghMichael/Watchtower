import { useEffect, useState } from "react";
import { Container, Card, Form, Button, Alert, Row, Col, Badge, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    otp: "",
    method: "totp",
    remember: false,
  });
  const [captchaToken, setCaptchaToken] = useState(null);
  const [status, setStatus] = useState(null);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const RECAPTCHA_SITE_KEY = "6LdpfCosAAAAAPkiy7uI1G9c3-SRkrUfA_L5FXOM";

  // Hide the navbar on the login page
  useEffect(() => {
    const nav = document.querySelector(".nav-shell");
    const prevDisplay = nav?.style.display;
    if (nav) nav.style.display = "none";
    return () => {
      if (nav) nav.style.display = prevDisplay || "";
    };
  }, []);

  // Load and execute reCAPTCHA v3
  useEffect(() => {
    const scriptId = "recaptcha-script";
    const existingScript = document.getElementById(scriptId);

    const obtainToken = () => {
      const gre = window.grecaptcha || window.grecaptcha?.enterprise;
      if (!gre?.execute) return;
      setCaptchaLoading(true);
      const executor = gre.ready ? gre.ready : (cb) => cb();
      executor(() => {
        gre
          .execute(RECAPTCHA_SITE_KEY, { action: "login" })
          .then((token) => {
            setCaptchaToken(token);
            setCaptchaLoading(false);
          })
          .catch(() => {
            setCaptchaToken(null);
            setCaptchaLoading(false);
          });
      });
    };

    if (!existingScript) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
      script.async = true;
      script.defer = true;
      script.onload = obtainToken;
      document.body.appendChild(script);
    } else {
      obtainToken();
    }
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
    // Mock validation only; no real auth wired
    if (!form.email || !form.password || !form.otp || !captchaToken) {
      setStatus({ variant: "danger", message: "Please complete all fields, 2FA, and captcha." });
      return;
    }
    setStatus({ variant: "success", message: "Credentials captured. Authentication not yet wired." });
    setTimeout(() => navigate("/"), 800);
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

          {status && <Alert variant={status.variant}>{status.message}</Alert>}

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
                  <Form.Label className="text-light mb-0">Two-Factor Authentication</Form.Label>
                  <small className="text-muted d-block">Required for access</small>
                </div>
                <Badge bg="info" text="dark">Required</Badge>
              </div>
              <Form.Check
                type="radio"
                id="method-totp"
                label="Authenticator App (TOTP)"
                name="method"
                value="totp"
                checked={form.method === "totp"}
                onChange={handleChange}
                className="text-light"
              />
              <Form.Check
                type="radio"
                id="method-email"
                label="Email OTP"
                name="method"
                value="email"
                checked={form.method === "email"}
                onChange={handleChange}
                className="text-light"
              />
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

            <div className="bg-body-secondary bg-opacity-10 rounded-3 p-3 mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <Form.Label className="text-light mb-0">Bot Verification</Form.Label>
                <Badge bg="secondary">reCAPTCHA v3</Badge>
              </div>
              <div className="d-flex align-items-center justify-content-between">
                <small className="text-muted">
                  A token is generated automatically via reCAPTCHA v3.
                </small>
                <Button
                  variant="outline-light"
                  size="sm"
                  onClick={() => {
                    setCaptchaToken(null);
                    const gre = window.grecaptcha || window.grecaptcha?.enterprise;
                    if (gre?.execute) {
                      (gre.ready ? gre.ready : (cb) => cb())(() =>
                        gre
                          .execute(RECAPTCHA_SITE_KEY, { action: "login" })
                          .then((token) => setCaptchaToken(token))
                          .catch(() => setCaptchaToken(null))
                      );
                    }
                  }}
                  disabled={captchaLoading}
                >
                  {captchaLoading ? <Spinner animation="border" size="sm" /> : "Refresh"}
                </Button>
              </div>
              {captchaToken ? (
                <small className="text-success d-block mt-2">Captcha verified.</small>
              ) : (
                <small className="text-warning d-block mt-2">Captcha not yet verified.</small>
              )}
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

            <Button variant="info" type="submit" className="w-100">
              Sign In Securely
            </Button>

            <div className="text-center mt-3">
              <small className="text-muted">
                Trouble signing in? <a href="#reset" className="text-info">Reset password</a> or <a href="#support" className="text-info">contact support</a>.
              </small>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default LoginPage;
