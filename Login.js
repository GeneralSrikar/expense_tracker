import React, { useState, useEffect } from 'react';
import './App.css';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { auth } from './Firebase';
import logo from './images/logo1.png';
import { collection, doc, getDoc, updateDoc, getDocs } from 'firebase/firestore';
import { db } from './Firebase';

/**
 * Login component displays the first screen user's view when they use the app
 * It has email and password text fields allowing users/admins to enter their 
 * credentials for a personalized view
 * 
 * - Uses Firebase Authentication and Firestore for credential validation.
 * - Redirects to admin or user dashboards based on role.
 * 
 * @component
 * @returns {JSX.Element} The Login Page UI
 */

await setPersistence(auth, browserLocalPersistence);

const Login = () => {
  // State to store the user's email 
  const [email, setEmail] = useState('');
  // State to store the user's password
  const [password, setPassword] = useState('');
  // State which sets the error message when an error occurs
  const [errorMessage, setErrorMessage] = useState('');
  //React Router's navigation hook
  const navigate = useNavigate();
  // State to ensure user credential are maintained
  const [keepLoggedIn, setKeepLoggenIn] = useState(false);

  {/*Initially sets the email and password blank*/}
  useEffect(() => {
    setEmail('');
    setPassword('');
  }, []);

  {/* Stay Logged-in feature */}
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('savedCredentials') || '{}');
    const savedEmail = Object.keys(saved)[0];
    if (savedEmail) {
      setEmail(savedEmail);
      setPassword(saved[savedEmail]);
      setKeepLoggenIn(true);
    }
  }, []);

  {/*Handles login form submission.*/}
  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const groupsSnapshot = await getDocs(collection(db, 'groups'));
      let role = null;
      let foundInGroups = [];

      for (const groupDoc of groupsSnapshot.docs) {
        const usersSnapshot = await getDocs(collection(db, 'groups', groupDoc.id, 'users'));

        for (const userDoc of usersSnapshot.docs) {
          const userData = userDoc.data();
          const userEmail = (userData.email || '').toLowerCase();

          if (userEmail === email.toLowerCase()) {
            const userRole = (userData.type || userData.Role || userData.role || '').toLowerCase();
            foundInGroups.push({
              groupId: groupDoc.id,
              role: userRole
            });
          }
        }
      }

      if (foundInGroups.length > 0) {
        const matchedGroup = foundInGroups[0]; 
        const role = matchedGroup.role;

        if (foundInGroups.length > 1) {
          console.warn(`User found in multiple groups: ${foundInGroups.map(g => g.groupId).join(', ')}`);
        }

        if (keepLoggedIn) {
          localStorage.setItem('savedCredentials', JSON.stringify({ [email]: password }));
        } else {
          localStorage.removeItem('savedCredentials');
        }

        if (role === 'admin') {
          navigate('/Home');
        } else {
          navigate('/UserHome');
        }
      } else {
        await auth.signOut();
        setErrorMessage("No group account found for this email. Please contact support.");
      }

    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage(error.code === 'auth/invalid-credential'
        ? "Invalid email or password"
        : "Login failed. Please try again.");
    }
  };

  {/*Main Component UI*/}
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
        {/* Logo Image and welcome message*/}
        <img src={logo} alt="Logo" className="login-logo" style={{
          width: '250px',
          height: '140px',
          marginBottom: '20px',
          marginTop: '30px',
          marginLeft: '-35px',
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
          marginTop: '0px',
          marginRight: '110px',
          marginBottom: '0px'
        }}>Welcome</h1>
        {/* Login form container */}
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
            marginTop: '10px'
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
              <label htmlFor="password" style={{
                width: '100px',
                fontSize: '18px',
                color: '#555',
                textAlign: 'right',
                marginTop: '20px',
                marginBottom: '-20px'
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
                  marginBottom: '-20px'
                }}
              />
            </div>
            {/* keepLoggedIn Check-Box */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginTop: '45px',
              marginRight: '150px',
              marginBottom: '-20px'
            }}>
              <input
                type="checkbox"
                id="keepLoggedIn"
                checked={keepLoggedIn}
                onChange={() => setKeepLoggenIn(!keepLoggedIn)}
                style={{ width: '18px', height: '18px' }}
              />
              <label htmlFor="keepLoggedIn" style={{
                fontSize: '17px',
                color: '#555',
                marginTop: '0px'
              }}>
                Keep me logged in
              </label>
            </div>
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
          {/* Error message */}
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
          {/* Signup and Forgot Password Links */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            marginTop: '0px',
          }}>
            <Link to="/signup2" style={{
              color: '#3498db',
              fontSize: '20px',
              textDecoration: 'underline',
              transition: 'color 0.3s',
              marginTop: '5px'
            }}>Signup</Link>
            <Link to="/forgot" style={{
              color: '#3498db',
              fontSize: '20px',
              textDecoration: 'underline',
              transition: 'color 0.3s',
              marginTop: '5px'
            }}>Forgot Password?</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
