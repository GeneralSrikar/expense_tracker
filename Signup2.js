import React, { useState, useEffect } from 'react';
import './App.css';
import { auth, db } from './Firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import logo from './images/logo1.png';
import { FaClipboardList, FaGamepad, FaMoneyBillWave, FaHistory, FaUsers, FaWallet } from 'react-icons/fa';
import { Link } from 'react-router-dom';
/**
 * Component which presents multiple signup options
 * Allows navigation to user signup, admin signup, or initial admin signup pages
 * @returns {JSX.Element} - Sign up options and navigation
 */
const Signup2 = () => {
  //Stores first name of logged-in user
  const [FirstName, setFirstName] = useState('');
  // Indicates if user data is still loading
  const [loading, setLoading] = useState(true);
  // React Router's navigation hook
  const navigate = useNavigate();

  {/*Fetches the user's first name from firebase*/}
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      try {
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setFirstName(userData.FirstName || 'User');
          }
        }
      } catch (error) { 
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  {/*Handles navigation back to the login page*/}
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)'
      }}>
        <div>Loading...</div>
      </div>
    );
  }
  
  {/*Main Component UI*/}
  return (
    <div
      className="home-container"
      style={{
        minHeight: '100vh',
        width: '100vw',
        backgroundImage: 'url("/Wall10.jpeg")',
        padding: 0,
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        alignItems: 'center',
        justifyContent: 'flex-start',
        overflow: 'hidden'
      }}
    >
      <div
        className="home-content-centered"
        style={{
          marginTop: '60px',
          borderRadius: '22px',
          padding: '40px 0 0 0',
          maxWidth: '440px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* Logo Image */}
        <img
          src={logo}
          alt="Logo"
          style={{
            display: 'block',
            margin: '0 auto',
            maxWidth: '250px',
            height: 'auto',
            marginTop: '-115px',
            marginBottom: '25px',
            marginLeft: '70px'
          }}
        />
        {/* Header with Choose Option message */}
        <div
          className="header"
          style={{
            marginTop: '18px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            width: '100%',
            marginBottom: '0px'
          }}
        >
        </div>
        <h1
          className="home-title"
          style={{
            marginTop: '-25px',
            marginBottom: '-25px',
            color: 'black',
            fontWeight: 700,
            fontSize: '1.4em',
            letterSpacing: '1px',
            textShadow: '0 2px 8px rgba(0,0,0,0.07)'
          }}
        >
          Choose Option
        </h1>
        {/* Button container with the various sign up options */}
        <div
          className="button-container"
          style={{
            marginTop: '20px',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            width: '80%',
            alignItems: 'center',
            gap: '15px',
            background: 'white',
            boxShadow: '0 2px 16px rgba(0,0,0,0.10)',
            border: '1px solid #eee',
            borderRadius: '10px',
            height: '315px',
            marginLeft: '0px',
            scale: 0.90
          }}
        >
          <button
            className="home-button"
            style={{
              background: 'linear-gradient(90deg, #007bff 60%, #0056b3 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '1.2em',
              padding: '12px 0',
              width: '80%',
              boxShadow: '0 2px 10px rgba(0,0,0,0.09)',
              transition: 'background 0.2s, transform 0.2s',
              marginBottom: '-23px',
              letterSpacing: '0.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              marginTop: '25px'
            }}
            onClick={() => handleNavigation('/user-signup')}
          >
            User Signup
          </button>
          <button
            className="home-button"
            style={{
              background: 'linear-gradient(90deg, #007bff 60%, #0056b3 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '1.13em',
              padding: '12px 0',
              width: '80%',
              boxShadow: '0 2px 12px rgba(0,0,0,0.09)',
              transition: 'background 0.2s, transform 0.2s',
              marginBottom: '-23px',
              letterSpacing: '0.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}
            onClick={() => handleNavigation('/admin-signup')}
          >
            Admin SignUp
          </button>
          <button
            className="home-button"
            style={{
              background: 'linear-gradient(90deg, #007bff 60%, #0056b3 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '1.13em',
              padding: '12px 0',
              width: '80%',
              boxShadow: '0 2px 12px rgba(0,0,0,0.09)',
              transition: 'background 0.2s, transform 0.2s',
              marginBottom: '-23px',
              letterSpacing: '0.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}
            onClick={() => handleNavigation('/initial-admin-signup')}
          >
            Initial Admin SignUp
          </button>
          {/* Navigation button back to login*/}
          <Link to="/login" style={{
          marginTop: '40px',
          color: '#007bff',
          fontWeight: 600,
          fontSize: '1.1em',
          textDecoration: 'underline',
          display: 'block',
          textAlign: 'center'
        }}>
          Back to Login
        </Link>
        </div>
        <div style={{ height: '50px' }} />
      </div>
    </div>
  );
};

export default Signup2;