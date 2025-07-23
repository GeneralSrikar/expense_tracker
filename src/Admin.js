import React, { useState, useEffect } from 'react';
import './App.css';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './Firebase';
import logo from './images/logo1.png';
import { db } from './Firebase';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';

const Admin = () => {
  const [email, setEmail] = useState('');
  const [firebasePassword, setFirebasePassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adminPassphrase, setAdminPassphrase] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [isPassphraseValid, setIsPassphraseValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setEmail('');
    setFirebasePassword('');
    setConfirmPassword('');
    setAdminPassphrase('');
    setShowPasswordFields(false);
    setIsPassphraseValid(false);
  }, []);

  const DUMMY_ADMIN_PASSWORD = "admin1234";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Check if admin exists in Firestore
      const adminQuery = query(
        collection(db, 'admin'),
        where('email', '==', email)
      );
      const querySnapshot = await getDocs(adminQuery);

      if (querySnapshot.empty) {
        setErrorMessage('No admin account found for this email. Please contact the app owner or use Admin Signup.');
        setIsLoading(false);
        return;
      }

      // No need to check password in Firestore, just use Firebase Auth
      await signInWithEmailAndPassword(auth, email, firebasePassword);
      setSuccessMessage('Successfully logged in as admin!');
      setTimeout(() => navigate('/home'), 1500);
    } catch (error) {
      console.error("Auth error:", error);
      switch (error.code) {
        case 'auth/email-already-in-use':
          setErrorMessage('Email already registered. Please log in.');
          break;
        case 'auth/wrong-password':
          setErrorMessage('Incorrect password. Please try again.');
          break;
        case 'auth/user-not-found':
          setErrorMessage('No user found with this email.');
          break;
        case 'auth/weak-password':
          setErrorMessage('Password should be at least 6 characters.');
          break;
        default:
          setErrorMessage('Authentication error. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };
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
      paddingTop: '20px',
      backgroundColor: '#f5f5f5'
    }}>
      <img 
        src={logo} 
        alt="Logo" 
        style={{
          width: '280px',
          marginBottom: '15px',
          marginTop: '-30px'
        }} 
      />
      <h1 style={{
        textAlign: 'center',
        margin: '0 0 24px 0',
        fontSize: '2em',
        color: '#333',
        fontWeight: 'bold',
        marginTop: '-45px'
      }}>Admin Login</h1>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: 'white',
        padding: '20px',
        borderRadius: '6px',
        boxShadow: '0 1px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <form onSubmit={handleSubmit}>
          {/* Email Field */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0px', marginLeft: '-20px' }}>
            <label htmlFor="email" style={{
              width: '140px',
              fontSize: '14px',
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
              autoComplete="off"
              style={{
                flex: 1,
                padding: '8px 10px',
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                height: '36px',
                boxSizing: 'border-box',
                marginTop: '15px',
                marginLeft: '10px',
                minWidth: '0',
                width: '230px',
                maxWidth: '100%'
              }}
            />
          </div>


          {/* Firebase Password Field */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0px', marginLeft: '-20px' }}>
                <label htmlFor="firebasePassword" style={{
                  width: '140px',
                  fontSize: '14px',
                  color: '#555',
                  textAlign: 'right',
                  whiteSpace: 'nowrap'
                }}>Password:</label>
                <input
                  type="password"
                  id="firebasePassword"
                  value={firebasePassword}
                  onChange={(e) => setFirebasePassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    fontSize: '14px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    height: '36px',
                    boxSizing: 'border-box',
                    marginTop: '15px',
                    marginLeft: '10px'
                  }}
                />
              </div>
          {/* Submit and Login Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '10px' }}>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                backgroundColor: isLoading ? '#cccccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                maxWidth: '160px'
              }}
            >
              {isLoading ? 'Processing...' : 'Submit'}
            </button>
            <button
              type="button"
              onClick={handleLoginClick}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                backgroundColor: isLoading ? '#cccccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                maxWidth: '160px'
              }}
            >
              Login
            </button>
          </div>
        </form>
        {/* Success Message */}
        {successMessage && (
          <p style={{
            color: '#388e3c',
            textAlign: 'center',
            margin: '10px 0 5px',
            fontSize: '14px',
            fontWeight: 'bold',
            width: '100%'
          }}>
            {successMessage}
          </p>
        )}
        {/* Error Message */}
        {errorMessage && (
          <p style={{
            color: '#d32f2f',
            textAlign: 'center',
            margin: '10px 0 5px',
            fontSize: '13px'
          }}>
            {errorMessage}
          </p>
        )}
        {/* Links */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '15px',
          fontSize: '13px'
        }}>
          <Link to="/Adminsignup" style={{
            color: '#007bff',
            textDecoration: 'none',
            width: '40%',
            textAlign: 'center',
            padding: '10px 0',
            borderRadius: '4px',
            background: '#f5f5f5',
            marginRight: '10px'
          }}>
           Admin Signup
          </Link>
          <Link to="/forgot" style={{
            color: '#007bff',
            textDecoration: 'none',
            width: '40%',
            textAlign: 'center',
            padding: '10px 0',
            borderRadius: '4px',
            background: '#f5f5f5',
            marginLeft: '10px'
          }}>
            Forgot Password?
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Admin;