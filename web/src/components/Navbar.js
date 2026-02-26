import { Container, Nav, Navbar, NavDropdown, Button, Form } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';
import { clearAuth, getUser, isAuthenticated } from '../utils/auth';
import { useTheme } from '../theme/ThemeProvider';

function NavigationBar() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const authed = isAuthenticated();
  const user = getUser();
  const isAdmin = user?.role === 'admin';
  const perms = user?.role_permissions || [];
  const has = (p) => isAdmin || perms.includes(p);

  if (!authed) {
    return null;
  }

  const handleLogout = () => {
    clearAuth();
    navigate('/login', { replace: true });
  };

  return (
    <Navbar expand="lg" className="nav-shell shadow-lg">
      <Container>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center brand-glow">
          <div className="brand-icon me-2">
            <i className="bi bi-display" />
          </div>
          <span className="fw-bold">WATCHTOWER</span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" className="border-0 nav-toggle" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto align-items-lg-center nav-links">
            <Nav.Link as={Link} to="/" className="nav-pill">
              Dashboard
            </Nav.Link>
            <NavDropdown title="Servers" id="servers-dropdown" className="nav-pill">
              <NavDropdown.Item as={Link} to="/servers">
                View All Servers
              </NavDropdown.Item>
              {has("manage_servers") && (
                <NavDropdown.Item as={Link} to="/server/add">
                  Add Server
                </NavDropdown.Item>
              )}
            </NavDropdown>

            {has("manage_accounts") && (
              <NavDropdown title="Accounts" id="accounts-dropdown" className="nav-pill">
                <NavDropdown.Item as={Link} to="/accounts">
                  View All Accounts
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/account/create">
                  Add Account
                </NavDropdown.Item>
              </NavDropdown>
            )}

            <NavDropdown title="Management" id="management-dropdown" className="nav-pill">
              {has("manage_roles") && (
                <NavDropdown.Item as={Link} to="/roles">
                  Roles
                </NavDropdown.Item>
              )}
              <NavDropdown.Item as={Link} to="/tickets">
                Support Tickets
              </NavDropdown.Item>
            </NavDropdown>

            <NavDropdown title="Security" id="security-dropdown" className="nav-pill">
              {has("view_audit_logs") && (
                <NavDropdown.Item as={Link} to="/audit-logs">
                  Audit Logs
                </NavDropdown.Item>
              )}
              {has("backup_read") && (
                <NavDropdown.Item as={Link} to="/backups">
                  Backups
                </NavDropdown.Item>
              )}
              {has("manage_sessions") && (
                <NavDropdown.Item as={Link} to="/sessions">
                  Sessions
                </NavDropdown.Item>
              )}
            </NavDropdown>

            <Nav.Link
              as={Link}
              to="/tickets"
              className="nav-pill"
              title="Support tickets"
              aria-label="Support tickets"
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <i className="bi bi-ticket-perforated-fill"></i>
            </Nav.Link>
          </Nav>

          <div className="d-flex align-items-center gap-3 mt-3 mt-lg-0">
            <Form.Check
              type="switch"
              id="theme-toggle"
              label={theme === 'dark' ? 'Dark' : 'Light'}
              checked={theme === 'dark'}
              onChange={toggle}
              className="theme-toggle"
            />
            <NavDropdown
              align="end"
              title={
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: user?.profile_color || "#10a37f",
                    overflow: "hidden",
                    border: "2px solid rgba(255,255,255,0.18)",
                    flexShrink: 0,
                  }}
                >
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt="avatar"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, lineHeight: 1 }}>
                      {user?.username?.slice(0, 1)?.toUpperCase() || "?"}
                    </span>
                  )}
                </span>
              }
              id="profile-dropdown"
              className="nav-pill nav-avatar-dropdown"
            >
              <NavDropdown.Item as={Link} to={`/account/${user?.id || ''}`}>
                View Profile
              </NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={handleLogout}>
                Sign Out
              </NavDropdown.Item>
            </NavDropdown>
            <Button variant="outline-light" size="sm" className="nav-ghost" onClick={() => navigate('/servers')}>
              Servers
            </Button>
            <Button variant="info" size="sm" className="nav-cta" onClick={() => navigate('/server/add')}>
              + Add Server
            </Button>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavigationBar;
