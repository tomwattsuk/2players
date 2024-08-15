// client/src/components/Header.js
import React from 'react';
import { Link } from 'react-router-dom';

function Header() {
  const isLoggedIn = !!localStorage.getItem('token');

  return (
    <header>
      <nav>
        <ul>
          <li><Link to="/">Home</Link></li>
          {isLoggedIn ? (
            <>
              <li><Link to="/profile">Profile</Link></li>
              <li><button onClick={() => {
                localStorage.removeItem('token');
                window.location.reload();
              }}>Logout</button></li>
            </>
          ) : (
            <>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Register</Link></li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
}

export default Header;