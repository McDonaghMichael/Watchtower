import { Container, Nav, Navbar, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';

function NavigationBar() {
  const navigate = useNavigate();

  return (
    <Navbar className='dark-navbar' expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">
          <i className="bi bi-display me-2"></i>
          WATCHTOWER
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Dashboard</Nav.Link>
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
          

          <NavDropdown title="Management" id="management-dropdown">
           <NavDropdown.Item as={Link} to="/">
                Roles
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/">
                Reports
              </NavDropdown.Item>
              
              <NavDropdown.Item as={Link} to="/">
                Settings
              </NavDropdown.Item>
            </NavDropdown>

            <NavDropdown title="Security" id="security-dropdown">
               <NavDropdown.Item as={Link} to="/">
                Audit Logs
              </NavDropdown.Item>
            
              <NavDropdown.Item as={Link} to="/">
                Sessions
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/">
                Alerts
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/">
                Backups
              </NavDropdown.Item>
            </NavDropdown>
            

</Nav>

          <Navbar.Text>
            Signed in as: <a href="#login">John Doe</a>
          </Navbar.Text>

        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavigationBar;