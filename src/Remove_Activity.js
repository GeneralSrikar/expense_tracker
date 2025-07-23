import React, { useState, useEffect } from 'react';
import './App.css';
import { useNavigate } from 'react-router-dom';
import logo from './images/logo1.png';
import { signOut } from 'firebase/auth';
import { auth, db } from './Firebase';
import { collection, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';

const RemoveActivity = () => {
  const navigate = useNavigate();
  const [activityName, setActivityName] = useState('');
  const [activityDoc, setActivityDoc] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [userFirstName, setUserFirstName] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userDoc = await getDocs(query(collection(db, 'users'), where('email', '==', user.email)));
          if (!userDoc.empty) {
            const userData = userDoc.docs[0].data();
            setUserFirstName(userData.FirstName);
          }
        } catch (error) {
          console.error('Error fetching user first name:', error);
        }
      }
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };
  const handleGameClick = async () => {
    navigate('/game-history')
  };

  const handleEnterClick = async () => {
    if (activityName.trim() === '') {
      alert('Please enter an activity name.');
      return;
    }
    try {
      const q = query(collection(db, 'activities'), where('activityName', '==', activityName.trim()));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setActivityDoc({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
        setShowForm(true);
      } else {
        alert('Activity not found.');
        setShowForm(false);
        setActivityDoc(null);
      }
    } catch (error) {
      console.error('Error fetching activity:', error);
      alert('Failed to fetch activity details.');
    }
  };

  const handleDeleteClick = async () => {
    if (!activityDoc) return;
    const confirmed = window.confirm('Are you sure you want to delete this activity?');
    if (!confirmed) return;
    try {
      // Fix: Use doc() to get the document reference, not collection().doc()
      await deleteDoc(doc(db, 'activities', activityDoc.id));
      alert('Activity deleted successfully');
      setActivityDoc(null);
      setShowForm(false);
      setActivityName('');
    } catch (error) {
      console.error('Error deleting activity:', error);
      alert('Failed to delete activity.');
    }
  };

  const handleHomeClick = () => {
    navigate('/home');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        background: 'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        position: 'relative'
      }}
    >
      <img
        src={logo}
        alt="Logo"
        style={{
          display: 'block',
          margin: '40px auto 0 auto',
          maxWidth: '360px',
          height: 'auto',
          marginTop: '-30px'
        }}
      />
      <h1
        style={{
          marginTop: '-30px',
          textAlign: 'center',
          fontWeight: 700,
          fontSize: '2.1em',
          color: 'black',
          marginBottom: '70px',
          letterSpacing: '1px',
          textShadow: '0 2px 8px rgba(0,0,0,0.07)',
          marginRight: '70px'
        }}
      >
        Remove Activity
      </h1>
      <h2
        style={{
          textAlign: 'center',
          marginTop: '-30px',
          fontWeight: 400,
          fontSize: '1.2em',
          maxWidth: '420px',
          marginBottom: '18px',
          lineHeight: 1.3,
          color: '#333'
        }}
      >
        Enter the name of the activity you want deleted:
      </h2>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: '0px',
        marginBottom: '18px',
        minWidth: '320px',
        width: '350px',
        maxWidth: '100%',
        gap: '12px'
      }}>
        <input
          type="text"
          placeholder="Activity name"
          value={activityName}
          onChange={(e) => setActivityName(e.target.value)}
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid #ccc',
            fontSize: '16px',
            minWidth: '180px',
            margin: 0
          }}
        />
        <button
          onClick={handleEnterClick}
          style={{
            padding: '10px 28px',
            borderRadius: '8px',
            border: 'none',
            background: '#007bff',
            color: 'white',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '1em',
            margin: 0
          }}
        >
          Enter
        </button>
        <button
          onClick={handleGameClick}
          style={{
            padding: '12px 40px',
            borderRadius: '8px',
            border: 'none',
            background: '#007bff',
            color: 'white',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.8em',
            margin: 0,
            whiteSpace: 'nowrap' // Prevent line break
          }}
        >
          Game History
        </button>
      </div>

      {showForm && activityDoc && (
        <div
          style={{
            marginTop: '0px',
            width: '100%',
            maxWidth: '500px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            alignItems: 'center'
          }}
        >
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {[
              { label: 'Activity Name:', value: activityDoc.activityName || 'N/A' },
              { label: 'Date:', value: activityDoc.activityDate?.seconds
                  ? new Date(activityDoc.activityDate.seconds * 1000).toLocaleDateString()
                  : (typeof activityDoc.activityDate === 'string'
                    ? activityDoc.activityDate
                    : 'N/A') },
              { label: 'Expense Per Head:', value: activityDoc.expensePerHead !== undefined ? `$${activityDoc.expensePerHead}` : 'N/A' },
              { label: 'Total Amount:', value: activityDoc.totalExpense !== undefined ? `$${activityDoc.totalExpense}` : 'N/A' },
              { label: 'Attendees:', value: Array.isArray(activityDoc.membersChecked)
                  ? activityDoc.membersChecked.join(', ')
                  : (activityDoc.membersChecked || 'N/A') }
            ].map((item, idx) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  minHeight: '38px',
                  gap: '12px'
                }}
              >
                <label style={{
                  fontWeight: 500,
                  minWidth: '120px',
                  marginRight: '0.5em',
                  textAlign: 'right'
                }}>
                  {item.label}
                </label>
                <span style={{
                  flex: 1,
                  textAlign: 'left'
                }}>{item.value}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', width: '100%', justifyContent: 'center', gap: '18px', marginTop: '10px' }}>
            <button type="button" style={{ padding: '10px 24px' }} onClick={handleDeleteClick}>Delete</button>
            <button
              type="button"
              style={{ padding: '10px 24px' }}
              onClick={handleHomeClick}
            >
              Home
            </button>
          </div>
        </div>
      )}
      {/* Welcome and Logout (same style as Home page) */}
      <div
        style={{
          position: 'absolute',
          right: '30px',
          top: '40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          zIndex: 2
        }}
      >
        <span
          className="user-name"
          style={{
            alignSelf: 'flex-end',
            marginRight: '0px',
            marginTop: '-20px',
            fontSize: '1.2em',
            color: '#333',
            fontWeight: 600,
            letterSpacing: '0.5px'
          }}
        >
          Welcome, {userFirstName ? userFirstName : 'User'}!
        </span>
        <span
          className="logout-link"
          onClick={handleLogout}
          style={{
            color: 'grey',
            cursor: 'pointer',
            textDecoration: 'underline',
            fontSize: '1.2em',
            background: 'none',
            border: 'none',
            padding: 0,
            marginTop: '2px',
            marginRight: '0px',
            alignSelf: 'flex-end'
          }}
        >
          Logout
        </span>
      </div>
    </div>
  );
};

export default RemoveActivity;
