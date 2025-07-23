import React, { useState, useEffect } from 'react';
import './App.css';
import { auth, db } from './Firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import logo from './images/logo1.png';
/**
 * Your Balance Admin component which allows users to check their balance 
 * just by typing in their phone number 
 * @component
 * @returns {JSX.Element} - Your Balance Admin UI
 */
const BalanceVerification = () => {
  const navigate = useNavigate();
  // States for checking if phone number is valid and not someone else's
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  //States for logged-in user
  const [FirstName, setFirstName] = useState('');
  const [userGroupId, setUserGroupId] = useState(null);

  const normalizePhoneNumber = (phone) => {
    return phone.replace(/\D/g, '');
  };

  {/*Fetch user group and first name of logged-in member*/}
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const groupsSnapshot = await getDocs(collection(db, 'groups'));
          for (const groupDoc of groupsSnapshot.docs) {
            const userDoc = await getDoc(doc(db, 'groups', groupDoc.id, 'users', user.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setFirstName(userData.FirstName || userData.firstName);
              setUserGroupId(groupDoc.id);
              break;
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  {/*Fetch user balance when verified*/}
  useEffect(() => {
  let isMounted = true;

  const fetchUserBalance = async () => {
    if (!verified || !userGroupId || !userData?.uid) return;
    
    try {
      setLoading(true);
      const userDocRef = doc(db, 'groups', userGroupId, 'users', userData.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (isMounted) {
        if (userDocSnap.exists()) {
          const userBalance = userDocSnap.data().amount || 0;
          setUserData(prev => ({
            ...prev,
            amount: userBalance
          }));
        } else {
          setUserData(prev => ({
            ...prev,
            amount: 0
          }));
        }
      }
    } catch (error) {
      if (isMounted) {
        console.error('Error fetching user balance:', error);
        setError('Failed to fetch balance. Please try again.');
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

  fetchUserBalance();

  return () => {
    isMounted = false; 
  };
}, [verified, userGroupId]);

{/*Handles Submission after checking phone number validity*/}
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    if (normalizedPhone.length < 10) {
      throw new Error('Please enter a valid 10-digit phone number');
    }

    if (!userGroupId) {
      throw new Error('Unable to verify your group membership. Please try again later.');
    }

    const usersRef = collection(db, 'groups', userGroupId, 'users');
    
    let q = query(usersRef, where('phone', '==', normalizedPhone));
    let querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      q = query(usersRef, where('phoneNumber', '==', normalizedPhone));
      querySnapshot = await getDocs(q);
    }

    if (querySnapshot.empty) {
      throw new Error('No user found with that phone number in your group.');
    }

    const memberDoc = querySnapshot.docs[0];
    const memberData = memberDoc.data();

    const memberFirstName = memberData.FirstName || memberData.firstName || '';
    if (memberFirstName.toLowerCase() !== FirstName.toLowerCase()) {
      throw new Error('Name does not match the account associated with this phone number.');
    }

    const clonedData = JSON.parse(JSON.stringify(memberData));
    clonedData.uid = memberDoc.id;
    setUserData(clonedData);

    setVerified(true);
  } catch (err) {
    setError(err.message);
    setVerified(false);
  } finally {
    setLoading(false);
  }
};

  {/*Handle Logout*/}
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };
  {/*Loading screen*/}
  if (loading) {
    return (
      <div className="home-container" style={{ justifyContent: 'flex-start', paddingTop: '0px', background: '#fdffdf' }}>
        <img
          src={logo}
          alt="Logo"
          style={{
            display: 'block',
            margin: '-40px auto 10px auto',
            maxWidth: '250px',
            height: 'auto',
            position: 'static',
            marginTop: '0px',
            marginLeft: '-40px'
          }}
        />
        <div style={{ marginTop: '-60px', fontSize: '0.5emm' }}>
          <div className="loader" style={{ margin: '100px auto', textAlign: 'center' }}>
            <div style={{
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #007bff',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }}></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  {/*Main Component UI*/}
  return (
    <div className="home-container" style={{ justifyContent: 'flex-start', paddingTop: '0px', background: '#fdf6ec' }}>
      {/*Logo and Title*/}
      <img
        src={logo}
        alt="Logo"
        style={{
          display: 'block',
          margin: '-40px auto 10px auto',
          maxWidth: '250px',
          height: 'auto',
          position: 'static',
          marginTop: '-15px',
          marginLeft: '-30px',
          marginBottom: '50px'
        }}
      />
      <h2 style={{
        position: 'absolute',
        top: '-30px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'none',
        color: 'Black',
        padding: '8px 24px',
        borderRadius: '30px',
        fontSize: '1.4em',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        zIndex: 1,
        marginBottom: '30px',
        marginTop: '140px'
      }}>
        Balance Verification
      </h2>
      {/*Welcome Message + Logout Link*/}
      <div className="welcome-section" style={{
        position: 'absolute',
        right: '30px',
        top: '40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        zIndex: 2
      }}>
        <span className="user-name" style={{
          alignSelf: 'flex-end',
          marginRight: '-35px',
          marginTop: '-40px',
          fontSize: '0.9em',
          color: '#333',
          fontWeight: 600,
          letterSpacing: '0.5px'
        }}>
          Welcome, {FirstName}!
        </span>
        <span className="logout-button1" onClick={handleLogout} style={{
          color: 'grey',
          cursor: 'pointer',
          textDecoration: 'underline',
          fontSize: '1.1em',
          background: 'none',
          border: 'none',
          padding: 0,
          marginTop: '2px',
          marginRight: '-35px',
          alignSelf: 'flex-end'
        }}>
          Logout
        </span>
      </div>
      {/*Main Form when unverified*/}
      <div className="member-list-container" style={{
        marginTop: '-125px',
        maxWidth: '900px',
        width: '295%',
        marginLeft: '-215px',
        marginRight: 'auto',
        background: 'white',
        borderRadius: '6px',
        padding: '38px 27px 32px 27px',
        minHeight: '405px',
        maxHeight: '780px',
        overflowY: 'auto',
        fontSize: '1em',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 24px rgba(0,0,0,0.20)',
        marginBottom: '20px',
        position: 'relative',
        scale: '0.57'
      }}>
        {!verified && !verificationSent && (
          <div style={{
            marginBottom: '-100px',
            fontSize: '1.75em',
            color: '#333',
            textAlign: 'center',
            fontWeight: 500,
            marginTop: '0px'
          }}>
            Enter phone number for current balance:
          </div>
        )}
        {/*Main Form when verified*/}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginLeft: '5px', width: '90%'}}>
          {verified && userData ? (
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.5em', marginBottom: '20px', marginLeft: '20px' }}>
                Thanks for confirming, {userData.FirstName || userData.firstName}!
              </h2>
              <div style={{
                background: '#f8f9fa',
                borderRadius: '8px',
                padding: '20px',
                margin: '0 auto 30px',
                maxWidth: '400px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
                marginLeft: '20px'
              }}>
                <h3 style={{ fontSize: '1.5em', marginBottom: '10px' }}>Your Balance:</h3>
                <div style={{
                  fontSize: '2.5em',
                  fontWeight: 'bold',
                  color: '#28a745',
                  margin: '20px 0'
                }}>
                  ${userData.amount !== undefined ? Number(userData.amount).toFixed(2) : '0.00'}
                </div>
              </div>
              {/*Back Button to take back to original state*/}
              <button
                onClick={() => {
                  setVerified(false);
                  setUserData(null);
                  setError('');
                  setPhoneNumber('');
                }}
                style={{
                  padding: '10px 32px',
                  fontSize: '1.8em',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
                  marginTop: '10px',
                  marginLeft: '20px'
                }}
              >
                Back
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{
                width: '100%',
                maxWidth: '500px',
                margin: '20px auto',
                textAlign: 'center',
                border: '2.3px solid #ddd',
                borderRadius: '12px',
                padding: '30px',
                marginLeft: '-10px',
                marginTop: '150px',
                marginBottom: '30px'
              }}
            >
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                fontSize: '1.7em',
              }}>Phone Number:</label>
              
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. 5551234567"
                required
                style={{
                  width: '50%',
                  padding: '12px',
                  fontSize: '1.1em',
                  borderRadius: '4px',
                  marginBottom: '20px'
                }}
              />
              {/*Submit Button*/}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '38%',
                  padding: '12px 24px',
                  fontSize: '1.5em',
                  background: loading ? '#cccccc' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  marginTop: '10px'
                }}
              >
                {loading ? 'Verifying...' : 'Submit'}
              </button>

              {error && (
                <p style={{ color: 'red', marginTop: '10px', fontSize: '1.2em' }}>
                  {error}
                </p>
              )}
            </form>
          )}
        </div>
        {/*Navigation to home button*/}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '28px',
          paddingTop: '10px',
          borderTop: '2px solid #eee',
          width: '100%'
        }}>
          <button
            onClick={() => navigate('/UserHome')}
            style={{
              padding: '10px 32px',
              fontSize: '1.8em',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 500,
              cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              marginTop: '10px',
              marginBottom: '0px',
              marginLeft: '-15px'
            }}
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default BalanceVerification;