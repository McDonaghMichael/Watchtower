import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav>
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/servers">Servers</Link></li>
        <li><Link to="/accounts">Accounts</Link></li>
      </ul>
    </nav>
  );
}

export default Navbar;