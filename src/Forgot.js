import React, { useState } from 'react';
import './App.css';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from './Firebase';
import { useNavigate } from 'react-router-dom';
import logo from './images/logo1.png';
/**
 * Forgot component which allows member's to reset their passwords if they have forgot 
 * @component
 * @returns {JSX.Element} - Forgot Password UI
 */
const ForgotPassword = () => {
  // State required to fill for password change
  const [email, setEmail] = useState('');
  // Error and success messages
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  // React router's navigation hook
  const navigate = useNavigate();

  {/*Checks validity of email then sends an email to the user*/}
  const handleSubmit = async (event) => {
    event.preventDefault();

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address.');
      setSuccessMessage('');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage('A password reset link has been sent to your email.');
      setErrorMessage('');
      setTimeout(() => {
        navigate('/login'); 
      }, 3000)
    }catch (error) {
      console.error('Error during password reset:', error);
      setErrorMessage('Failed to send password reset email. Please try again.');
      setSuccessMessage('');
    }
  };

  {/* Handles Logout */}
   const handleLoginClick = (e) => {
    e.preventDefault();
    window.location.href = '/login';
  };

  {/* Main Component UI */}
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f0f4fa'
    }}>
      {/* Logo */}
      <img 
        src={logo} 
        alt="Logo" 
        style={{
          width: '300px',
          marginBottom: '110px',
          marginTop: '-360px',
          marginLeft: '30px'
        }} 
      />
      {/* Main Form */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.10)',
        padding: '38px 32px 24px 32px',
        maxWidth: '300px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: '-30px',
        marginLeft: '0px',
        scale: '0.97'
      }}>
        <form id="forgotPasswordForm" onSubmit={handleSubmit} style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          margin: 0,
          background: 'transparent',
          boxShadow: 'none',
          padding: 0,
          alignItems: 'center',
          scale: '0.93',
          marginLeft: '0px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label htmlFor="email" style={{
              fontSize: '15px',
              color: '#555',
              textAlign: 'right',
              whiteSpace: 'nowrap',
              minWidth: '90px',
              marginTop: '0px',
              marginLeft: '-50px'
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
              }}
            />
          </div>
          {/* Verify email and Login Button */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '20px',
            width: '100%',
            marginTop: '10px'
          }}>
            <button
              type="submit"
              className="login-button"
              style={{
                width: '40%',
                padding: '8px',
                fontSize: '15px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Verify Email
            </button>
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
                fontWeight: 'bold'
              }}
            >
              Login
            </button>
          </div>
        </form>
        {/* Success and Error messages */}
        {errorMessage && (
          <p id="errorMessage">
            {errorMessage}
          </p>
          )}
      {successMessage && (
        <p id="successMessage" style={{ color: 'red' }}>
          {successMessage}
        </p>
      )}      
      </div>
    </div>
  );
};

export default ForgotPassword;