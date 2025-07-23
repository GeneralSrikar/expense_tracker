import React, { useState, useEffect } from 'react';
import './App.css';
import { auth, db } from './Firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import logo from './images/logo1.png';
import { FaClipboardList, FaGamepad, FaMoneyBillWave, FaHistory, FaUsers, FaWallet } from 'react-icons/fa';
/**
 * Home component displays the main dashboard for logged-in users
 * It fetches and displays the user's first name and provides navigation buttons
 * 
 * @component
 * @returns {JSX.Element} The Home page UI
 */
const UserHome = () => {
  // State to store user's first name
  const [firstName, setFirstName] = useState('');
  // State to manage the loading status
  const [loading, setLoading] = useState(true);
  // React Router's navigation hook
  const navigate = useNavigate();
  
  {/* Fetches member's first name */}
  useEffect(() => {
    const fetchUserData = async (user) => {
      try {
        if (!user) return;
        
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('User data from users collection:', userData);
          
          const name = userData.firstName || 
                      userData.FirstName || 
                      userData.firstname || 
                      userData.first_name || 
                      'User';
          setFirstName(name);
          return;
        }

        const groupsSnapshot = await getDocs(collection(db, 'groups'));
        for (const groupDoc of groupsSnapshot.docs) {
          const userRef = doc(db, 'groups', groupDoc.id, 'users', user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userData = userSnap.data();
            console.log('User data from groups collection:', userData); 
            
            const name = userData.firstName || 
                        userData.FirstName || 
                        userData.firstname || 
                        userData.first_name || 
                        'User';
            setFirstName(name);
            return;
          }
        }

        setFirstName('User');
      } catch (error) {
        console.error('Error fetching user data:', error);
        setFirstName('User');
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged(user => {
      fetchUserData(user);
    });

    return () => unsubscribe();
  }, []);
  {/* Handles user logout */}
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

  // displays loading screen while fetching user data
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

  {/* Main Component UI */}
  return (
    <div
      className="home-container"
      style={{
        minHeight: '100vh',
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
        {/* Logo image */}
        <img
          src={logo}
          alt="Logo"
          style={{
            display: 'block',
            margin: '0 auto',
            maxWidth: '250px',
            height: 'auto',
            marginTop: '-120px',
            marginBottom: '5px',
            marginLeft: '77px'
          }}
        />
        {/* Welcome Message and Logout */}
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
          <span
            className="user-name"
            style={{
              alignSelf: 'flex-end',
              marginRight: '-3px',
              marginTop: '-20px',
              fontSize: '0.97em',
              color: '#333',
              fontWeight: 600,
              letterSpacing: '0.5px'
            }}
          >
            Welcome, {firstName}!
          </span>
          <span
            className="logout-link"
            onClick={handleLogout}
            style={{
              cursor: 'pointer',
              color: 'grey',
              textDecoration: 'underline',
              marginTop: '2px',
              fontSize: '1.0em',
              marginLeft: '10px',
              marginRight: '-2px',
              alignSelf: 'flex-end'
            }}
          >
            Logout
          </span>
        </div>
        {/* Title */}
        <h1
          className="home-title"
          style={{
            marginTop: '-10px',
            marginBottom: '-10px',
            color: 'black',
            fontWeight: 700,
            fontSize: '1.8em',
            letterSpacing: '1px',
            textShadow: '0 2px 8px rgba(0,0,0,0.07)',
            marginLeft: '0px'
          }}
        >
          Home
        </h1>
        {/* Navigation Buttons for different pages */}
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
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
            padding: '0px 0px 20px 0',
            border: '1px solid #eee',
            height: '350px',
            marginLeft: '15px'
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
              padding: '16px 0',
              width: '80%',
              boxShadow: '0 2px 10px rgba(0,0,0,0.09)',
              transition: 'background 0.2s, transform 0.2s',
              marginBottom: '-38px',
              letterSpacing: '0.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              marginTop: '25px'
            }}
            onClick={() => handleNavigation('/user-members')}
          >
            <FaUsers size={26.1} style={{ marginRight: 0 }} />
            Member List
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
              padding: '16px 0',
              width: '80%',
              boxShadow: '0 2px 12px rgba(0,0,0,0.09)',
              transition: 'background 0.2s, transform 0.2s',
              marginBottom: '-38px',
              letterSpacing: '0.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}
            onClick={() => handleNavigation('/user-game-history')}
          >
            <FaGamepad size={26.5} style={{ marginRight: 0 }} />
            Game History
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
              padding: '16px 0',
              width: '80%',
              boxShadow: '0 2px 12px rgba(0,0,0,0.09)',
              transition: 'background 0.2s, transform 0.2s',
              marginBottom: '-38px',
              letterSpacing: '0.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}
            onClick={() => handleNavigation('/user-balance-history')}
          >
            <FaHistory size={26.1} style={{ marginRight: 0 }} />
            Balance History
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
              padding: '16px 0',
              width: '80%',
              boxShadow: '0 2px 12px rgba(0,0,0,0.09)',
              transition: 'background 0.2s, transform 0.2s',
              marginBottom: '-38px',
              letterSpacing: '0.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}
            onClick={() => handleNavigation('/your-balance')}
          >
            <FaWallet size={26.1} style={{ marginRight: 0 }} />
            Check Balance
          </button>
        </div>
        <div style={{ height: '50px' }} />
      </div>
    </div>
  );
};

export default UserHome;