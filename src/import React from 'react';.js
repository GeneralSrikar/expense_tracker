import React from 'react';
import './App.css';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';

const Home = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        navigate('/login');
      })
      .catch((error) => {
        console.error('Error signing out:', error);
      });
  };

  return (
    <div className="home-container">
      <div className="home-header-row">
        <span className="welcome-user">Welcome User</span>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>
      <div className="home-content">
        <h1 className="home-title">Your Title Here</h1>
        <div className="button-group">
          {/* Add your buttons here */}
        </div>
      </div>
    </div>
  );
};

export default Home;