import React, { useState } from 'react';
import './App.css';
import { db, auth } from './Firebase';
import { doc, setDoc, getDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import logo from './images/logo1.png';

/**
 * Initial Setup component which allows the original admin to set up the group's admin and group code
 * in order to distinguish between members who are users and admin
 * @component
 * @returns {JSX.Element} - The Initial Setup UI
 */
const Signup = () => {
  // States for setting up group codes
  const [groupCode, setGroupCode] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [confirmAdminCode, setConfirmAdminCode] = useState('');
  const [confirmGroupCode, setConfirmGroupCode] = useState('');
  // Success and Error Messages
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  // Loading State for submission
  const [isLoading, setIsLoading] = useState(false);
  // React Router's navigation hook
  const navigate = useNavigate();

  // Firebase Cloud Function calls
  const functions = getFunctions();
  const sendAdminSetupEmail = httpsCallable(functions, 'sendAdminSetupEmail');

  {/*Checks the validity of inputs*/}
  const validateInputs = () => {
  const groupCodeTrimmed = groupCode.trim();
  const confirmGroupCodeTrimmed = confirmGroupCode.trim();
  const adminCodeTrimmed = adminCode.trim();
  const confirmAdminCodeTrimmed = confirmAdminCode.trim();

  if (!groupCodeTrimmed || !confirmGroupCodeTrimmed || !adminCodeTrimmed || !confirmAdminCodeTrimmed) {
    setErrorMessage("All fields are required.");
    return false;
  }

  if(!/^\d{4,7}$/.test(groupCodeTrimmed)){
    setErrorMessage("Group Code must be a number between 4 to 7 digits");
    return false;
  }
  if(!/^\d{4,7}$/.test(adminCodeTrimmed)){
    setErrorMessage("Admin Code must be a number between 4 to 7 digits");
    return false;
  }
  if (!/^\d+$/.test(groupCodeTrimmed) || isNaN(parseInt(groupCodeTrimmed, 10))) {
    setErrorMessage("Group Code must be a valid number.");
    return false;
  }

  if (!/^\d+$/.test(adminCodeTrimmed) || isNaN(parseInt(adminCodeTrimmed, 10))) {
    setErrorMessage("Admin Code must be a valid number.");
    return false;
  }

  if (groupCodeTrimmed !== confirmGroupCodeTrimmed) {
    setErrorMessage("Group Codes do not match.");
    return false;
  }

  if (adminCodeTrimmed !== confirmAdminCodeTrimmed) {
    setErrorMessage("Admin Codes do not match.");
    return false;
  }

  if (adminCodeTrimmed == groupCodeTrimmed){
    setErrorMessage("Admin Code and Group Code cannot be the same.");
    return false;
  }

  return true;
  };

  {/*Handles the form submission and adds admin to specified group*/}
  const handleSubmit = async (event) => {
  event.preventDefault();
  setIsLoading(true);
  setErrorMessage('');
  setSuccessMessage('');

  if (!validateInputs()) {
    setIsLoading(false);
    return;
  }

  try {
    const groupCodeNumber = parseInt(groupCode.trim(), 10);
    const adminCodeNumber = parseInt(adminCode.trim(), 10);
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error("No authenticated user found");
    }

    const groupCodeString = groupCodeNumber.toString();
    const adminCodeString = adminCodeNumber.toString();

    const adminCodesRef = doc(db, 'Config', 'adminCodes');
    const adminCodesDoc = await getDoc(adminCodesRef);
    
    if (adminCodesDoc.exists()) {
      const existingCodes = adminCodesDoc.data();
      
      if (existingCodes[adminCodeString]) {
        throw new Error("This admin code is already in use. Please choose a different one.");
      }
      
      if (Object.values(existingCodes).includes(groupCodeString)) {
        throw new Error("This group code is already in use by another admin. Please choose a different one.");
      }
    }

    const groupDocRef = doc(db, 'groups', groupCodeString);
    const groupDoc = await getDoc(groupDocRef);
    
    if (groupDoc.exists()) {
      throw new Error("This group code is already in use. Please choose a different one.");
    }

    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      throw new Error("User document not found");
    }

    const userData = userDoc.data();
    const firstName = userData.FirstName || 'Admin';
    const lastName = userData.LastName || 'Admin';
    const phoneNumber = userData.phoneNumber || '';

    const batch = writeBatch(db);

    batch.set(groupDocRef, {
      groupCode: groupCodeNumber,
      createdAt: new Date(),
      memberCount: 1
    });

    const groupUserDocRef = doc(db, 'groups', groupCodeString, 'users', currentUser.uid);
    batch.set(groupUserDocRef, {
      FirstName: firstName,
      LastName: lastName,
      email: currentUser.email,
      phoneNumber: phoneNumber,
      role: 'Admin',
      createdAt: new Date()
    });

    batch.set(adminCodesRef, {
      [adminCodeString]: groupCodeString
    }, { merge: true });

    batch.delete(userDocRef);

    await batch.commit();

    if (currentUser.email) {
      try {
        await sendAdminSetupEmail({
          email: currentUser.email,
          adminCode: adminCodeNumber,
          groupCode: groupCodeNumber,
        });
      } catch (emailError) {
        console.error('Email send error:', emailError);
      }
    }

    setSuccessMessage("Setup completed successfully! You can now manage your group.");
    setTimeout(() => navigate('/login'), 2000);

  } catch (error) {
    console.error('Error during setup:', error);
    setErrorMessage(error.message || "Error during setup. Please try again.");
  } finally {
    setIsLoading(false);
  }
  };

  {/*Handles navigation to login screen*/}
  const handleLoginClick = (e) => {
    e.preventDefault();
    navigate('/login');
  };

  {/*Main component UI*/}
  return (
  <div style={{
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center',
    minHeight: '100vh', 
    padding: '20px', 
    backgroundColor: '#e3f0ff', 
    justifyContent: 'center'
  }}>
    {/* Logo and Title */}
    <img 
      src={logo} 
      alt="Logo" 
      style={{ 
        width: '250px', 
        marginBottom: '50px', 
        marginTop: '-158px' 
      }} 
    />
    <h1 style={{ 
      textAlign: 'center', 
      fontSize: '1.5em', 
      color: '#333', 
      fontWeight: 'bold', 
      marginBottom: '20px', 
      marginTop: '-40px' 
    }}>
      Initial Setup
    </h1>

    <form onSubmit={handleSubmit} style={{
      width: '120%', 
      maxWidth: '420px', 
      background: '#fff',
      borderRadius: '12px', 
      boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
      padding: '30px', 
      marginBottom: '20px', 
      scale: '0.75', 
      marginTop: '-70px',
      maxHeight: '500px',
      whiteSpace: 'nowrap',
      gap: '10px'
    }}>

      {/* Input Fields */}
      {[{
        label: 'Admin Code:',
        value: adminCode,
        setter: setAdminCode
      }, {
        label: 'Confirm Admin Code:',
        value: confirmAdminCode,
        setter: setConfirmAdminCode
      }, {
        label: 'Group Code:',
        value: groupCode,
        setter: setGroupCode
      }, {
        label: 'Confirm Group Code:',
        value: confirmGroupCode,
        setter: setConfirmGroupCode
      }].map(({ label, value, setter }, i) => (
        <div 
          key={i} 
          style={{ 
            display: 'flex',
            alignItems: 'center',
            marginBottom: '20px',
            gap: '10px'
          }}
        >
          <label style={{ 
            width: '150px',
            marginRight: '15px', 
            fontSize: '15px', 
            color: '#555',
            textAlign: 'right'
          }}>
            {label}
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => setter(e.target.value)}
            required
            style={{
              flex: 1, 
              padding: '10px', 
              fontSize: '15px',
              border: '1px solid #ddd', 
              borderRadius: '6px', 
              boxSizing: 'border-box',
              marginTop: '15px'
            }}
          />
        </div>
      ))}

      {/* Login and Submit Button */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        gap: '15px',
        marginTop: '20px'
      }}>
        <button 
          type="button" 
          onClick={handleLoginClick} 
          style={{
            width: '120%',
            flex: 1, 
            padding: '14px', 
            fontSize: '16px',
            backgroundColor: '#f0f0f0', 
            color: '#333', 
            border: 'none',
            borderRadius: '6px', 
            cursor: 'pointer', 
            fontWeight: 'bold',
            opacity: isLoading ? 0.7 : 1
          }} 
          disabled={isLoading}
        >
          Login
        </button>
        <button 
          type="submit" 
          style={{
            width: '120%',
            flex: 1, 
            padding: '12px', 
            fontSize: '16px', 
            backgroundColor: '#007bff',
            color: 'white', 
            border: 'none', 
            borderRadius: '6px', 
            cursor: 'pointer',
            fontWeight: 'bold', 
            opacity: isLoading ? 0.7 : 1
          }} 
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Submit'}
        </button>
      </div>
    </form>

    {/* Success and Error messages */}
    {errorMessage && (
      <p style={{ 
        color: 'red', 
        marginTop: '-70px', 
        textAlign: 'center', 
        maxWidth: '420px', 
        padding: '0 20px' 
      }}>
        {errorMessage}
      </p>
    )}
    {successMessage && (
      <p style={{ 
        color: 'green', 
        marginTop: '-70px', 
        textAlign: 'center', 
        maxWidth: '420px', 
        padding: '0 20px' 
      }}>
        {successMessage}
      </p>
    )}
  </div>
);
};

export default Signup;
