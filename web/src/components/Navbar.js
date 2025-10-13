import { Container, Nav, Navbar, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';

function NavigationBar() {
  const navigate = useNavigate();

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="navbar-custom">
      <Container>
        <Navbar.Brand as={Link} to="/">
          <i className="bi bi-display me-2"></i>
          WATCHTOWER
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <NavDropdown title="Servers" id="servers-dropdown">
              <NavDropdown.Item as={Link} to="/servers">
                View All Servers
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/servers/add">
                Add Server
              </NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item as={Link} to="/servers/monitoring">
                Monitoring Dashboard
              </NavDropdown.Item>
            </NavDropdown>

            <NavDropdown title="Accounts" id="accounts-dropdown">
              <NavDropdown.Item as={Link} to="/accounts">
                View All Accounts
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/accounts/add">
                Add Account
              </NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item as={Link} to="/accounts/settings">
                Account Settings
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>

          <Nav>
            <NavDropdown 
              title={
                <div className="d-inline">
                  <img
                    src="https://github.com/identicons/user.png"
                    alt="User"
                    className="rounded-circle"
                    width="24"
                    height="24"
                  />
                  <span className="ms-2">Profile</span>
                </div>
              }
              id="user-dropdown"
              align="end"
            >
              <NavDropdown.Item as={Link} to="/profile">
                My Profile
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/settings">
                Settings
              </NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={() => navigate('/logout')}>
                Logout
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavigationBar;