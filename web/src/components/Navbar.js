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
              <NavDropdown.Item as={Link} to="/server/add">
                Add Server
              </NavDropdown.Item>
            </NavDropdown>

            <NavDropdown title="Accounts" id="accounts-dropdown">
              <NavDropdown.Item as={Link} to="/accounts">
                View All Accounts
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/account/create">
                Add Account
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>

        
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavigationBar;