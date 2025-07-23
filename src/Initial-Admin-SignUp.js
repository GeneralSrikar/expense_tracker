import React, { useState, useEffect } from 'react';
import './App.css';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './Firebase';
import logo from './images/logo1.png';
import { doc, getDoc, updateDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from './Firebase'
/**
 * Inital Admin Signup which makes original admin type in predefined email & password 
 * then navigates them to sign up as first person of the group
 * @component
 * @returns {JSX.Element} - Initial-Admin-Signup UI
 */
const Login = () => {
  // Required fields to fill
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Error messages
  const [errorMessage, setErrorMessage] = useState('');
  // React Router's navigation hook
  const navigate = useNavigate();
  // Predefined email and passwords for first member
  const ADMIN_EMAIL = 'admin@gmail.com';
  const ADMIN_PASSWORD = 'adminadmin';

  // Initally sets email and password to blank
  useEffect(() => {
    setEmail('');
    setPassword('');
  }, []);

  {/* Verified the email and password match then navigate to next screen */}
  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    if(email != ADMIN_EMAIL || password != ADMIN_PASSWORD){
      setErrorMessage('Invalid admin email or password');
      return;
    }
    try {
      const usersRef = collection(db, 'users');
      const adminQuery = query(usersRef, where('Role', '==', 'Admin'));
      const querySnapshot = await getDocs(adminQuery);
      if(!querySnapshot.empty){
        setErrorMessage('An Admin has already set up the codes. Use the other admin signup option!');
        return;
      }
      navigate('/admin-setup');
    } catch(error) {
      console.error('Error checking for existing admin: ', error);
      setErrorMessage('Error checking for admin status.');
    }
  };

  {/* Main Component */}
  return (
      <div style={{
        minHeight: '100vh',
        width: '100vw',
        backgroundImage: 'url("/Wall10.jpeg")', 
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0',
        margin: '0',
        boxSizing: 'border-box',
        overflow: 'auto',
        marginTop: '-40px'
      }}>
        <div className="login-container" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          justifyContent: 'center',
          width: '100%',
          padding: '20px',
        }}>

        {/* Logo and Page Title */}
        <img src={logo} alt="Logo" className="login-logo" style={{
          width: '250px',
          height: '145px',
          marginBottom: '0px',
          marginTop: '-10px',
          marginLeft: '-30px', 
          scale: 1.0,
          color: 'darkblue'
        }} />
        <h1 style={{
          textAlign: 'center',
          fontSize: '1.6em',
          color: 'darkblue',
          fontWeight: 'bold',
          background: 'none',
          boxShadow: 'none',
          marginTop: '-30px',
          marginRight: '110px',
          marginBottom: '10px'
        }}>Admin Signup</h1>

        {/* Login form container for member to fill out */}
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          padding: '30px 40px',
          width: '90%',
          maxWidth: '380px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: '-70px',
          scale: '0.66',
          marginRight: '0px',
          maxHeight: '400px'
        }}>
          <form id="loginForm" onSubmit={handleSubmit} style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            margin: 0,
            marginTop: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label htmlFor="email" style={{
                width: '100px',
                fontSize: '18px',
                color: '#555',
                textAlign: 'right',
              }}>Email:</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="off"
                style={{
                  flex: 1,
                  padding: '10px',
                  fontSize: '15px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  height: '40px',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.3s',
                  marginTop: '10px'
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label htmlFor="password" style={{
                width: '100px',
                fontSize: '18px',
                color: '#555',
                textAlign: 'right',
              }}>Password:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                style={{
                  flex: 1,
                  padding: '10px',
                  fontSize: '15px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  height: '40px',
                  boxSizing: 'border-box',
                  marginTop: '10px',
                  marginBottom: '0px'
                }}
              />
            </div>

            {/* Login Button */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              <button type="submit" style={{
                backgroundColor: '#3498db',
                color: '#fff',
                padding: '12px 30px',
                border: 'none',
                borderRadius: '30px',
                fontSize: '18px',
                cursor: 'pointer',
                width: '100%',
                transition: 'background-color 0.3s',
              }}>
                Login
              </button>
            </div>
          </form>

          {/* Error message*/}
          <p style={{
            minHeight: '18px',
            marginTop: '5px',
            color: '#e74c3c',
            fontSize: '16px',
            textAlign: 'center',
            visibility: errorMessage ? 'visible' : 'hidden',
            marginBottom: '0px'
          }}>
            {errorMessage || 'Placeholder'}
          </p>

          {/* Link to go back to sign in options*/}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            marginTop: '0px',
          }}>
            <Link to="/signup2" style={{
              color: '#3498db', 
              fontSize: '23px',
              textDecoration: 'underline',
              transition: 'color 0.3s',
              marginTop: '5px',
              marginLeft: '150px'
            }}>Back</Link>
          </div>
      </div>
    </div>
  </div>
  );
};

export default Login;
