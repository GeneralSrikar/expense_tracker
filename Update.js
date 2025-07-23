import React, { useState, useEffect } from 'react';
import './App.css';
import { useNavigate } from 'react-router-dom';
import logo from './images/logo1.png';
import { signOut } from 'firebase/auth';
import { auth, db, } from './Firebase';
import {
  collection,
  query,
  where,
  getDoc,
  getDocs,
  doc,
  updateDoc
} from 'firebase/firestore';
/**
 * Update Component which allows an admin to update a member's details whom are present in their group
 * @component
 * @returns {JSX.Element} - Update UI
 */
const normalizePhone = (number) => number.replace(/\D/g, '');
const isValidPhone = (phone) => /^\d{10}$/.test(normalizePhone(phone));
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const Update = () => {
  const navigate = useNavigate();
  // States for checking and changing the member's info
  const [FirstName, setFirstName] = useState('');
  const [LastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [originalPhone, setOriginalPhone] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  // State changing variables
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  // Logged-in user's information
  const [userFirstName, setUserFirstName] = useState('');
  const [docId, setDocId] = useState('');
  const [userGroupId, setUserGroupId] = useState(null);
  // Loading State
  const [isLoading, setIsLoading] = useState(false);

  {/*Gathering logged-in users name and groupID*/}
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
  {/*Checks for duplicate information when updating member*/}
  const checkExistingUser = async (currentDocId) => {
  if (!userGroupId) {
    return "Could not determine your group";
  }

  try {
    const usersRef = collection(db, 'groups', userGroupId, 'users');
    const normalizedPhone = normalizePhone(phoneNumber);
    const normalizedEmail = email.toLowerCase().trim();

    const [phoneSnapshot, phoneNumberSnapshot, emailSnapshot] = await Promise.all([
      getDocs(query(usersRef, where('phone', '==', normalizedPhone))),
      getDocs(query(usersRef, where('phoneNumber', '==', normalizedPhone))),
      getDocs(query(usersRef, where('email', '==', normalizedEmail)))
    ]);

    const phoneExists = [...phoneSnapshot.docs, ...phoneNumberSnapshot.docs]
      .some(doc => doc.id !== currentDocId);
    const emailExists = emailSnapshot.docs.some(doc => doc.id !== currentDocId);

    if (phoneExists && emailExists) {
      return "Both phone number and email already exist for other members in your group";
    }
    if (phoneExists) {
      return "Phone number already exists for another member in your group";
    }
    if (emailExists) {
      return "Email already exists for another member in your group";
    }
    return null;
  } catch (error) {
    console.error('Error checking existing user:', error);
    return 'Error checking existing user';
  }
};
  const handleEnterClick = async () => {
  if (phoneNumber.trim() === '') {
    alert('Please enter a phone number.');
    return;
  }
  if (!isValidPhone(phoneNumber)) {
    alert('Please enter a valid 10-digit phone number!');
    return;
  }
  if (!userGroupId) {
    alert('Could not determine your group. Please try again later.');
    return;
  }

  setIsLoading(true);
  try {
    const normalizedPhone = normalizePhone(phoneNumber);
    const usersRef = collection(db, 'groups', userGroupId, 'users');
    
    const [phoneQuery, phoneNumberQuery] = await Promise.all([
      getDocs(query(usersRef, where('phone', '==', normalizedPhone))),
      getDocs(query(usersRef, where('phoneNumber', '==', normalizedPhone)))
    ]);

    const matchingDocs = [...phoneQuery.docs, ...phoneNumberQuery.docs];
    
    if (matchingDocs.length > 0) {
      const docData = matchingDocs[0].data();
      
      setFirstName(docData.FirstName || docData.firstName || '');
      setLastName(docData.LastName || docData.lastName || '');
      setEmail(docData.email || '');
      setAmount(docData.amount || '');
      setDocId(matchingDocs[0].id);
      
      setOriginalPhone(docData.phoneNumber || docData.phone || '');
      setOriginalEmail(docData.email || '');
      
      setShowForm(true);
      setIsEditing(false);
    } else {
      alert('Member not found in your group.');
    }
  } catch (error) {
    console.error('Error fetching member:', error);
    alert('Failed to fetch member details.');
  } finally {
    setIsLoading(false);
  }
};
  {/*Handles saving and updating the member's info*/}
  const handleSave = async () => {
  if (!FirstName || !LastName || !email || !amount || !phoneNumber) {
    alert('Please fill out all fields before saving');
    return;
  }

  if (!isValidPhone(phoneNumber)) {
    alert('Please enter a valid 10-digit phone number!');
    return;
  }

  if (!isValidEmail(email)) {
    alert('Please enter a valid email!');
    return;
  }

  if (isNaN(parseFloat(amount))) {
    alert('Please enter a valid amount');
    return;
  }

  if (!userGroupId) {
    alert('Could not determine your group. Please try again later.');
    return;
  }

  setIsLoading(true);
  try {
    const usersRef = collection(db, 'groups', userGroupId, 'users');
    
    const [firstNameSnapshot, firstnameSnapshot] = await Promise.all([
      getDocs(query(usersRef, where('FirstName', '==', FirstName))),
      getDocs(query(usersRef, where('firstName', '==', FirstName)))
    ]);
    
    const nameExists = [...firstNameSnapshot.docs, ...firstnameSnapshot.docs]
      .some(doc => doc.id !== docId);

    if (nameExists) {
      setIsLoading(false);
      alert('There is already someone with the same first name in your group. Please change it.');
      return;
    }

    const phoneChanged = normalizePhone(phoneNumber) !== originalPhone;
    const emailChanged = email.toLowerCase().trim() !== originalEmail.toLowerCase().trim();

    if (phoneChanged || emailChanged) {
      const existingError = await checkExistingUser(docId);
      if (existingError) {
        setIsLoading(false);
        alert(existingError);
        return;
      }
    }

    await updateDoc(doc(db, 'groups', userGroupId, 'users', docId), {
      firstName: FirstName, 
      lastName: LastName, 
      email: email.toLowerCase().trim(),
      amount: parseFloat(amount),
      phoneNumber: normalizePhone(phoneNumber),
    });

    alert('Member updated successfully!');
    setIsEditing(false);
    setOriginalPhone(normalizePhone(phoneNumber));
    setOriginalEmail(email.toLowerCase().trim());
  } catch (error) {
    console.error('Error updating member:', error);
    alert(`Failed to update member: ${error.message}`);
  } finally {
    setIsLoading(false);
  }
};
  // Navigation tools
  const handleHomeClick = () => navigate('/home');
  const handleMemberClick = () => navigate('/members');

  {/*Main Component UI*/}
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        background: 'skyblue',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        position: 'relative'
      }}
    >
      {/*Logo and Title*/}
      <img
        src={logo}
        alt="Logo"
        style={{ display: 'block', margin: '40px auto 0 auto', maxWidth: '250px', height: 'auto', marginTop: '-10px' }}
      />
      <h1
        style={{
          marginTop: '-15px',
          textAlign: 'center',
          fontWeight: 700,
          fontSize: '1.4em',
          color: 'black',
          marginBottom: '70px',
          letterSpacing: '1px',
          textShadow: '0 2px 8px rgba(0,0,0,0.07)',
          marginRight: '10px',
          marginBottom: '60px'
        }}
      >
        Update Member
      </h1>
      {/* Inital setup with the field for phone number and the memberlist and enter buttons*/}
      <h2
        style={{
          textAlign: 'center',
          marginTop: '-50px',
          fontWeight: 400,
          fontSize: '1.2em',
          maxWidth: '420px',
          marginBottom: '11px',
          lineHeight: 1.3,
          color: '#333'
        }}
      >
        Enter the person's phone number:
      </h2>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '5px',
          minWidth: '320px',
          width: '420px',
          marginLeft: '-95px'
        }}
      >
        <input
          type="text"
          placeholder="Phone number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          style={{
            padding: '10px 6px',
            borderRadius: '8px',
            border: '1px solid #ccc',
            fontSize: '16px',
            minWidth: '180px',
            marginLeft: '110px',
            marginTop: '-5px',
            scale: 0.8
          }}
        />
        <button
          onClick={handleEnterClick}
          disabled={isLoading}
          style={{
            padding: '8px 11px',
            borderRadius: '8px',
            border: 'none',
            background: isLoading ? '#cccccc' : '#007bff',
            color: 'white',
            fontWeight: 600,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '0.9em',
            marginRight: '10px',
            marginTop: '-20px'
          }}
        >
          {isLoading ? 'Searching...' : 'Enter'}
        </button>
        {!showForm && (
          <button
            type="button"
            onClick={handleMemberClick}
            style={{
              padding: '8px 11px',
              borderRadius: '8px',
              border: 'none',
              background: '#007bff',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.85em',
              marginRight: '10px',
              whiteSpace: 'nowrap',
              marginTop: '-20px'
            }}
          >
            Member List
          </button>
        )}
      </div>
      {/*Form, with user's info that can be edited by the admin, shown after valid phone number entered*/}    
      {showForm && (
        <div
          style={{
            marginTop: isEditing ? '-10px': '0px',
            width: '123%',
            maxWidth: isEditing ? '550px' : '500px', 
            maxHeight: isEditing ? '700px': '470px',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
            padding: isEditing ? '20px' : '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: isEditing ? '0px' : '20px', 
            alignItems: 'center',
            marginBottom: '0px',
            position: 'relative',
            justifyContent: 'flex-start',
            transform: isEditing ? 'scale(0.63)' : 'scale(0.70)', 
            transformOrigin: 'top center'
          }}
        >
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: isEditing ? '-50px' : '20px' 
          }}>
            {['First Name', 'Last Name', 'Email', 'Amount', 'Phone'].map((label, idx) => {
              const values = [
                FirstName,
                LastName,
                email,
                amount === 0 || amount === '0' || amount === 0.0 ? 0 : amount,
                phoneNumber
              ];
              const setters = [setFirstName, setLastName, setEmail, setAmount, setPhoneNumber];
              return (
                <div key={label} style={{ display: 'flex', alignItems: 'center', marginBottom: isEditing ? '-5px': '20px' }}>
                  <label
                    style={{
                      minWidth: '110px',
                      fontWeight: 500,
                      fontSize: '1em',
                      marginRight: '10px',
                      textAlign: 'right',
                      marginBottom: '5px'
                    }}
                  >
                    {label}:
                  </label>
                  {isEditing ? (
                    <input
                      type={label === 'Amount' ? 'number' : 'text'}
                      value={values[idx]}
                      onChange={(e) => setters[idx](e.target.value)}
                      style={{
                        flex: 1,
                        fontSize: '1em',
                        height: '40px',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #ccc',
                        marginTop: '20px'
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        flex: 1,
                        fontSize: '1em',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        border: '1px solid #eee',
                        borderRadius: '6px',
                        background: '#fafbfc',
                        paddingLeft: '12px',
                        marginBottom: '-10px'
                      }}
                    >
                      {values[idx] === '' || values[idx] === undefined ? 'N/A' : values[idx]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {/*Buttons at the bottom to toggle the state of the form or go back to home or members screen */}
          <div
            style={{
              display: 'flex',
              gap: '20px',
              justifyContent: 'center',
              width: '100%',
              marginTop: '0px',
              scale: 0.80
            }}
          >
            <button
              onClick={isEditing ? handleSave : () => setIsEditing(true)}
              disabled={isLoading}
              style={{
                padding: '5px 36px',
                borderRadius: '8px',
                border: 'none',
                background: isLoading ? '#cccccc' : '#007bff',
                color: 'white',
                fontWeight: 600,
                fontSize: '1.2em',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                marginTop: '30px'
              }}
            >
              {isLoading ? 'Saving...' : isEditing ? 'Save' : 'Edit'}
            </button>
            <button
              type="button"
              onClick={handleHomeClick}
              style={{
                padding: '10px 36px',
                borderRadius: '8px',
                border: 'none',
                background: '#007bff',
                color: 'white',
                fontWeight: 600,
                fontSize: '1.2em',
                cursor: 'pointer',
                marginTop: '30px'
              }}
            >
              Home
            </button>
            <button
              type="button"
              onClick={handleMemberClick}
              style={{
                padding: '12px 20px',
                borderRadius: '8px',
                border: 'none',
                background: '#007bff',
                color: 'white',
                fontWeight: 600,
                fontSize: '1.15em',
                cursor: 'pointer',
                marginTop: '30px'
              }}
            >
              Member List
            </button>
          </div>
        </div>
      )}

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
        {/*Welcome message and logout link below it*/}
        <span
          style={{
            marginTop: '-30px',
            fontSize: '0.9em',
            color: '#333',
            fontWeight: 600,
            letterSpacing: '0.5px',
            marginRight: '-20px'
          }}
        >
          Welcome, {userFirstName || 'User'}!
        </span>
        <span
          onClick={handleLogout}
          style={{
            color: 'grey',
            cursor: 'pointer',
            textDecoration: 'underline',
            fontSize: '1.0em',
            background: 'none',
            border: 'none',
            padding: 0,
            marginTop: '2px',
            marginRight: '-20px'
          }}
        >
          Logout
        </span>
      </div>
    </div>
  );
};

export default Update;