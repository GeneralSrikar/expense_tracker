import React, { useState } from 'react';
import './App.css';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from './Firebase';
import { doc, setDoc } from 'firebase/firestore';
import logo from './images/logo1.png';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [FirstName, setFirstName] = useState('');
  const [LastName, setLastName] = useState('');
  const [ConfirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [adminPassphrase, setAdminPassphrase] = useState('');
  const [isPassphraseValid, setIsPassphraseValid] = useState(false);

  const DUMMY_ADMIN_PASSWORD = "admin1234";

  // Add useNavigate for navigation
  const navigate = window.reactRouterNavigate || (() => {}); // fallback for environments without react-router
  // If using react-router-dom v6+, use:
  // import { useNavigate } from 'react-router-dom';
  // const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isPassphraseValid) {
      if (adminPassphrase === DUMMY_ADMIN_PASSWORD) {
        setIsPassphraseValid(true);
      } else {
        setErrorMessage('Incorrect admin passphrase.');
        return;
      }
    }

    if (password !== ConfirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await setDoc(doc(db, 'admin', user.uid), {
        FirstName,
        LastName,
        email,
        isAdmin: true,
      });
      setSuccessMessage('Admin registered successfully! Redirecting to login...');
      setErrorMessage('');
      setTimeout(() => {
        window.location.href = '/admin';
      }, 1500);
    } catch (error) {
      console.error('Error during signup:', error);
      setErrorMessage(error.message);
      setSuccessMessage('');
    }
  };


  // Handler for Login button
  const handleLoginClick = (e) => {
    e.preventDefault();
    window.location.href = '/login';
    // Or if using react-router: navigate('/login');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '15px',
      paddingTop: '10px',
      backgroundColor: '#f5f5f5',
      marginTop: '0px'
    }}>
      <img 
        src={logo} 
        alt="Logo" 
        style={{
          width: '300px',
          marginBottom: '30px',
          marginTop: '-40px'
        }} 
      />
      <h1 style={{
        textAlign: 'center',
        margin: '0 0 24px 0',
        fontSize: '2em',
        color: '#333',
        marginTop: '-60px',
        marginLeft: '-30px'
      }}>Admin SignUp</h1>
      <form id="signupForm" onSubmit={handleSubmit}>
        {/* First Name */}
        <div className="form-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '0px', marginTop: '-20px'}}>
          <label htmlFor="FirstName" style={{
            width: '130px',
            minWidth: '130px',
            marginRight: '10px',
            fontSize: '15px',
            color: '#555',
            textAlign: 'right',
            whiteSpace: 'nowrap',
          }}>First Name:</label>
          <input
            type="text"
            id="FirstName"
            value={FirstName || ''}
            onChange={(e) => setFirstName(e.target.value)}
            required
            autoComplete="off"
            style={{
              flex: 1,
              padding: '8px 10px',
              fontSize: '15px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              height: '36px',
              boxSizing: 'border-box',
              marginTop: '20px'
            }}
          />
        </div>

        {/* Last Name */}
        <div className="form-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
          <label htmlFor="LastName" style={{
            width: '130px',
            minWidth: '130px',
            marginRight: '10px',
            fontSize: '15px',
            color: '#555',
            textAlign: 'right',
            whiteSpace: 'nowrap'
          }}>Last Name:</label>
          <input
            type="text"
            id="LastName"
            value={LastName || ''}
            onChange={(e) => setLastName(e.target.value)}
            required
            autoComplete="off"
            style={{
              flex: 1,
              padding: '8px 10px',
              fontSize: '15px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              height: '36px',
              boxSizing: 'border-box',
              marginTop: '20px'
            }}
          />
        </div>

        {/* Admin Passphrase Subheading and Field */}
        <div className="form-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '0px' }}>
          <label htmlFor="adminPassphrase" style={{
            width: '130px',
            minWidth: '130px',
            marginRight: '10px',
            fontSize: '15px',
            color: '#555',
            textAlign: 'right',
            whiteSpace: 'nowrap',
            marginTop: '-5px'
          }}>Passphrase:</label>
          <input
            type="password"
            id="adminPassphrase"
            value={adminPassphrase || ''}
            onChange={(e) => setAdminPassphrase(e.target.value)}
            required
            autoComplete="new-password"
            style={{
              flex: 1,
              padding: '8px 10px',
              fontSize: '15px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              height: '36px',
              boxSizing: 'border-box',
              marginTop: '0px'
            }}
          />
        </div>

        {/* Email */}
        <div className="form-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '0px' }}>
          <label htmlFor="email" style={{
            width: '130px',
            minWidth: '130px',
            marginRight: '10px',
            fontSize: '15px',
            color: '#555',
            textAlign: 'right',
            whiteSpace: 'nowrap'
          }}>Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              flex: 1,
              padding: '8px 10px',
              fontSize: '15px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              height: '36px',
              boxSizing: 'border-box',
              marginTop: '20px'
            }}
          />
        </div>

        {/* Password */}
        <div className="form-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '0px' }}>
          <label htmlFor="password" style={{
            width: '130px',
            minWidth: '130px',
            marginRight: '10px',
            fontSize: '15px',
            color: '#555',
            textAlign: 'right',
            whiteSpace: 'nowrap'
          }}>Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              flex: 1,
              padding: '8px 10px',
              fontSize: '15px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              height: '36px',
              boxSizing: 'border-box',
              marginTop: '20px'
            }}
          />
        </div>

        {/* Confirm Password */}
        <div className="form-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '0px' }}>
          <label htmlFor="ConfirmPassword" style={{
            width: '130px',
            minWidth: '130px',
            marginRight: '10px',
            fontSize: '15px',
            color: '#555',
            textAlign: 'right',
            whiteSpace: 'nowrap'
          }}>Confirm Password:</label>
          <input
            type="password"
            id="ConfirmPassword"
            value={ConfirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{
              flex: 1,
              padding: '8px 10px',
              fontSize: '15px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              height: '36px',
              boxSizing: 'border-box',
              marginTop: '20px'
            }}
          />
        </div>

        <button type="submit" style={{
          width: '40%',
          padding: '10px',
          fontSize: '16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '10px',
          marginRight: '150px'
        }}>Sign Up</button>
        <button
          type="button"
          onClick={handleLoginClick}
          style={{
            width: '40%',
            padding: '10px',
            fontSize: '16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '-39px',
            marginLeft: '160px'
          }}
        >Login</button>
      </form>
      {successMessage && (
        <p style={{
          color: '#388e3c',
          textAlign: 'center',
          margin: '10px 0 5px',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          {successMessage}
        </p>
      )}
      {errorMessage && <p id="errorMessage">{errorMessage}</p>}
    </div>
  );
};

export default Signup;