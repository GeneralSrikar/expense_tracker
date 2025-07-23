import React, { useState, useEffect } from 'react';
import './App.css';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './Firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import logo from './images/logo1.png';
/**
 * User Members component which displays all members present in the group
 * @component
 * @returns {JSX.Element} - UserMembers UI
 */
const UserMembers = () => {
  // State for all members 
  const [members, setMembers] = useState([]);
  // State for logged-in user's first name
  const [firstName, setFirstName] = useState('');
  // React Router's navigation hook
  const navigate = useNavigate();

  {/*Fetches the logged-in User's first name and group*/}
  useEffect(() => {
    const fetchGroupMembers = async () => {
      try {
        auth.onAuthStateChanged(async (user) => {
          if (!user) return;

          const userDocRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userDocRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setFirstName(userData.firstName || userData.FirstName || 'User');
            
            if (userData.groupId) {
              await fetchGroupUsers(userData.groupId);
              return;
            }
          }

          const groupsSnapshot = await getDocs(collection(db, 'groups'));
          for (const groupDoc of groupsSnapshot.docs) {
            const userRef = doc(db, 'groups', groupDoc.id, 'users', user.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
              const userData = userSnap.data();
              setFirstName(userData.firstName || userData.FirstName || 'User');
              await fetchGroupUsers(groupDoc.id);
              break;
            }
          }
        });
      } catch (error) {
        console.error('Error fetching group members:', error);
      }
    };

    {/*Fetches all the info about group's users*/}
    const fetchGroupUsers = async (groupId) => {
      try {
        const groupUsersRef = collection(db, "groups", groupId, "users");
        const groupUsersSnapshot = await getDocs(groupUsersRef);
        
        const allMembers = [];

        groupUsersSnapshot.forEach((userDoc) => {
          const data = userDoc.data();

          const normalizedData = {
            id: userDoc.id,
            FirstName: data.FirstName || data.firstName || 'N/A',
            LastName: data.LastName || data.lastName || 'N/A',
            Role: data.Role || data.role || data.Role || data.type || 'N/A',
            phoneNumber: data.phoneNumber || data.phone || 'N/A',
            email: data.email || data.Email || 'N/A'
          };

          allMembers.push(normalizedData);
        });

        setMembers(allMembers);
      } catch (error) {
        console.error('Error fetching group users:', error);
      }
    };

    fetchGroupMembers();
  }, []);

  {/*Handles Logout*/}
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  {/*Formats Phone Number for displaying*/}
  const formatPhoneNumber = (phone) => {
    if (!phone || phone === 'N/A') return 'N/A';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    }
    return phone;
  };

  {/* Main Component */}
  return (
    <div className="home-container" style={{ justifyContent: 'flex-start', paddingTop: '0px', background: '#f5f6fa' }}>
      {/*Logo and Welcome Message*/}
      <img
        src={logo}
        alt="Logo"
        style={{
          display: 'block',
          margin: '-40px auto 10px auto',
          maxWidth: '250px',
          height: 'auto',
          position: 'static',
          marginTop: '-20px',
          marginLeft: '-40px'
        }}
      />
      <div style={{ marginTop: '-60px', fontSize: '0.5emm' }}>
        <div
          className="welcome-section"
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
              marginRight: '-35px',
              marginTop: '-40px',
              fontSize: '0.9em',
              color: '#333',
              fontWeight: 600,
              letterSpacing: '0.5px'
            }}
          >
            Welcome, {firstName}!
          </span>
          {/*Logout Button*/}
          <span
            className="logout-button1"
            onClick={handleLogout}
            style={{
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
            }}
          >
            Logout
          </span>
        </div>
        {/*Member List Table*/}
        <div className="member-list-container" style={{
          marginTop: '-155px',
          maxWidth: '840px',
          width: '115%',
          marginLeft: '-75px',
          marginRight: 'auto',
          background: 'white',
          borderRadius: '6px',
          padding: '38px 26px 32px 27px',
          minHeight: '795px',
          maxHeight: '850px',
          overflowY: 'auto',
          fontSize: '1em',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
          marginBottom: '20px',
          position: 'relative',
          scale: '0.47'
        }}>
          <h2 style={{
            position: 'absolute',
            top: '-30px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'none',
            color: 'Black',
            padding: '4px 24px',
            borderRadius: '30px',
            fontSize: '2.5em',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            zIndex: 1,
            marginBottom: '40px',
            marginTop: '30px'
          }}>
            Member List
          </h2>
          <div style={{ flex: 1, overflowY: 'auto', marginTop: '20px' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                background: 'white',
                fontSize: '1.2em',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                marginBottom: '200px',
                marginTop: '15px'
              }}
            >
              <thead>
                <tr>
                  <th style={{ padding: '8px 20px', background: '#007bff', color: 'white', borderRadius: '0px 0px 0 0', fontSize: '0.9em', fontWeight: 600, whiteSpace: 'nowrap' }}>First Name</th>
                  <th style={{ padding: '8px 10px', background: '#007bff', color: 'white', fontSize: '0.9em', fontWeight: 600, whitespace: 'nowrap' }}>Last Name</th>
                  <th style={{ padding: '8px 10px', background: '#007bff', color: 'white', fontSize: '0.9em', fontWeight: 600 }}>Role</th>
                  <th style={{ padding: '6px 10px', background: '#007bff', color: 'white', fontSize: '0.9em', fontWeight: 600, minWidth: '90px' }}>Email</th>
                  <th style={{ padding: '6px 25px', background: '#007bff', color: 'white', fontSize: '0.9em', fontWeight: 600, minWidth: '110px' }}>Phone</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member, idx) => (
                  <tr
                    key={member.id}
                    style={{
                      borderBottom: '1px solid #eee',
                      background: idx % 2 === 0 ? '#f9f9f9' : '#fff'
                    }}
                  >
                    <td style={{ padding: '0px 7px', textAlign: 'center' }}>{member.FirstName}</td>
                    <td style={{ padding: '14px 7px', textAlign: 'center' }}>{member.LastName}</td>
                    <td style={{ padding: '14px 10px', textAlign: 'center' }}>{member.Role}</td>
                    <td style={{ padding: '14px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>{member.email}</td>
                    <td style={{ padding: '14px 10px', textAlign: 'center' }}>
                      {formatPhoneNumber(member.phoneNumber)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/*Home Button*/}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '30px',
            paddingTop: '33px',
            borderTop: '5px solid #eee',
            width: '100%',
            gap: '24px',
            fontSize: '20px',
            marginBottom: '-10px'
          }}>
            <button className="bottom_button" onClick={() => navigate('/UserHome')} style={buttonStyle}>Home</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const buttonStyle = {
  padding: '10px 32px',
  fontSize: '1.2em',
  background: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  fontWeight: 500,
  cursor: 'pointer',
  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  marginTop: '-20px',
  marginBottom: '0px'
};

export default UserMembers;