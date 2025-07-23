import React, { useState, useEffect } from 'react';
import './App.css';
import { useNavigate } from 'react-router-dom';
import logo from './images/logo1.png';
import { signOut } from 'firebase/auth';
import { auth, db } from './Firebase';
import { collection, doc, deleteDoc, getDocs, getDoc, query, where } from 'firebase/firestore';
/**
 * Delete Component which allows admin to delete a member of the group via their phone number
 * @component
 * @returns {JSX.Element} - Delete UI
 */
const isValidPhone = (phone) => {
  return /^\d{10}$/.test(phone.trim());
}

const Delete = () => {
  const navigate = useNavigate();
  // States to show member's info to confirm they are right member to delete
  const [FirstName, setFirstName] = useState('');
  const [LastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [showForm, setShowForm] = useState(false);
  // State for submission
  const [isSubmitted, setIsSubmitted] = useState(false);
  // States for logged-in user information
  const [userFirstName, setUserFirstName] = useState('');
  const [userGroupId, setUserGroupId] = useState(null);

  {/*Fetch the logged-in user's first name and group ID*/}
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const groupsSnapshot = await getDocs(collection(db, 'groups'));
          for (const groupDoc of groupsSnapshot.docs) {
            const userDoc = await getDoc(doc(db, 'groups', groupDoc.id, 'users', user.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setUserFirstName(userData.FirstName);
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

  {/*Handles Logout*/}
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };
  {/*Members button navigation*/}
  const handleMemberClick = () => {
    navigate('/members');
  };

  {/* Handles deletion of member after all checks */}
  const handleDeleteClick = async (e) => {
    e.preventDefault();
    if (!userGroupId) {
      alert('Could not determine your group. Please try again later.');
      return;
    }

    try {
      const confirmed = window.confirm(
        'Are you sure this is the member you want to delete?'
      );
      if (!confirmed) return;

      const membersRef = collection(db, 'groups', userGroupId, 'users');
      const q = query(membersRef, where('phoneNumber', '==', phoneNumber.trim()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        await deleteDoc(doc(db, 'groups', userGroupId, 'users', querySnapshot.docs[0].id));
        alert('Member deleted successfully');
        setFirstName('');
        setLastName('');
        setPhoneNumber('');
        setEmail('');
        setAmount('');
        setShowForm(false);
      } else {
        alert('Member not found in your group.');
      }
    } catch (error) {
      console.error('Error deleting member:', error);
      alert('Failed to delete member.');
    }
  };
  {/* Shows member's info after phone number is checked to be valid */}
  const handleEnterClick = async () => {
    if (phoneNumber.trim() === '') {
      alert('Please enter a phone number.');
      return;
    }
    if (!isValidPhone(phoneNumber)) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }
    if (!userGroupId) {
      alert('Could not determine your group. Please try again later.');
      return;
    }

    try {
      const membersRef = collection(db, 'groups', userGroupId, 'users');
      const q = query(membersRef, where('phoneNumber', '==', phoneNumber.trim()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const memberData = querySnapshot.docs[0].data();
        setFirstName(memberData.FirstName);
        setLastName(memberData.LastName);
        setEmail(memberData.email);
        setAmount(memberData.amount);
        setShowForm(true);
      } else {
        alert('No member found with that phone number in your group');
        setShowForm(false);
      }
    } catch (error) {
      console.error('Error fetching member:', error);
      alert('Failed to fetch member details.');
    }
  };

  {/* Handles Home Button Click after checking if everything is set */}
  const handleHomeClick = async () => {
    const hasData =
      FirstName.trim() ||
      LastName.trim() ||
      phoneNumber.trim() ||
      email.trim() ||
      amount;

    if (hasData) {
      const confirmSubmit = window.confirm(
        'You have unsaved changes. Do you want to submit before going home?'
      );
      if (confirmSubmit) {
        if (!userGroupId) {
          alert('Could not determine your group. Please try again later.');
          return;
        }
        
        try {
          const membersRef = collection(db, 'groups', userGroupId, 'users');
          const q = query(membersRef, where('phoneNumber', '==', phoneNumber.trim()));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            await deleteDoc(doc(db, 'groups', userGroupId, 'users', querySnapshot.docs[0].id));
            alert('Member deleted successfully');
            setFirstName('');
            setLastName('');
            setPhoneNumber('');
            setEmail('');
            setAmount('');
            setIsSubmitted(true);
          } else {
            alert('Member not found in your group.');
          }
        } catch(error) {
          alert('Failed to delete member.');
        }
      }
    }
    navigate('/home');
  };

  {/*Main Component UI*/}
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: 'skyblue',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
      }}
    >
      {/*Logo*/}
      <img
        src={logo}
        alt="Logo"
        style={{
          display: 'block',
          margin: '-35px auto 5px auto', 
          maxWidth: '250px',
          height: 'auto',
          marginTop: '0px'
        }}
      />
      {/*Page Title*/}
      <h1 style={{ textAlign: 'center', marginTop: '5px', fontWeight: 600, marginBottom: '10px', marginLeft: '-5px', fontSize: '1.4em'}}>
        Delete a Member
      </h1>
      {/* Prompt for phone number */}
      <h1
        style={{
          textAlign: 'center',
          marginTop: '0',
          fontWeight: 400,
          fontSize: '22px',
          maxWidth: '420px',
          marginBottom: '10px',
          lineHeight: 1.3,
          marginLeft: '-120px'
        }}
      >
        Enter the person's phone number:
      </h1>
      {/* Phone input and Enter/MemberList buttons */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: '0px',
        marginBottom: '20px',
        marginLeft: '-90px',
        minWidth: '400px',
        width: '500px',
        maxWidth: '100%',
        transform: 'scale(0.72)', 
        transformOrigin: 'left center'
      }}>
        <input
          type="text"
          placeholder="Phone number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          style={{
            padding: '14px 14px',
            borderRadius: '8px',
            border: '1.5px solid #ccc',
            fontSize: '18px',
            minWidth: '200px',
            marginLeft: '300px',
            marginTop: '2px'
          }}
        />
        <button
          onClick={handleEnterClick}
          style={{
            marginLeft: '18px',
            padding: '14px 20px',
            borderRadius: '8px',
            border: 'none',
            background: '#007bff',
            color: 'white',
            fontWeight: 500,
            fontSize: '18px',
            cursor: 'pointer',
            marginTop: '-10px'
          }}
        >
          Enter
        </button>
        {!showForm && (
          <button
            type="button"
            style={{
              padding: '14px 20px',
              marginLeft: '8px',
              marginTop: '-10px',
              borderRadius: '8px',
              border: 'none',
              background: '#007bff',
              color: 'white',
              fontWeight: 500,
              fontSize: '18px',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
            onClick={handleMemberClick}
          >
            MemberList
          </button>
        )}
      </div>
      {/* Member info + Delete/Home buttons */}
      {showForm && (
        <div
          style={{
            marginTop: '-20px',
            width: '80%',
            maxWidth: '500px',
            maxHeight: '440px',
            display: 'flex',
            flexDirection: 'column',
            gap: '25px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            padding: '32px 32px 32px 32px',
            alignItems: 'center',
            marginLeft: '-5px',
            transform: 'scale(0.90)',
            transformOrigin: 'top center'
          }}
        >
          {/* Display fetched member details */}
          <div style={{ display: 'flex', alignItems: 'center', width: '100%', marginTop:'-10px' }}>
            <label style={{ fontWeight: 500, minWidth: '100px', marginTop: '10px' }}>
              First Name:
            </label>
            <span>{FirstName || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <label style={{ fontWeight: 500, minWidth: '100px', marginTop: '10px' }}>
              Last Name:
            </label>
            <span>{LastName || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <label style={{ fontWeight: 500, minWidth: '100px', marginRight: '-40px', minWith: '0', marginTop: '10px' }}>
              Email:
            </label>
            <span>{email || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <label style={{ fontWeight: 500, minWidth: '100px', marginRight: '-20px', marginTop: '10px' }}>
              Amount:
            </label>
            <span>{amount || 'N/A'}</span>
          </div>
          {/* Buttons: Delete, Home, MemberList */}
          <div style={{ display: 'flex', width: '100%', justifyContent: 'center', gap: '16px', marginTop: '8px' }}>
            <button type="button" style={{ padding: '10px 20px', scale: 1.1 }} onClick={handleDeleteClick}>Delete</button>
            <button
              type="button"
              style={{ padding: '10px 20px', scale: 1.1 }}
              onClick={handleHomeClick}
            >
              Home
            </button>
            <button
              type="button"
              style={{ padding: '0px 10px', scale: 1.1}}
              onClick={handleMemberClick}
            >
              MemberList
            </button>
          </div>
        </div>
      )}
      {/* Welcome greeting and Logout link*/}
      <div className="welcome-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '100%' }}>
        <span style={{
          fontSize: '0.9em',
          color: '#333',
          marginBottom: '0px',
          fontWeight: 'bold'
        }}>
          Welcome, {userFirstName ? userFirstName : 'User'}!
        </span>
        <span
          className="logout-button1"
          onClick={handleLogout}
          style={{
            alignSelf: 'flex-end',
            marginRight: '-12px',
            marginTop: '-5px',
            fontSize: '1.0em'
          }}
        >
          Logout
        </span>
      </div>
    </div>
  );
};

export default Delete;
