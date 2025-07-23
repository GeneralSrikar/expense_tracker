import React, { useState } from 'react';
import './App.css';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from './Firebase';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import logo from './images/logo1.png';

 /**
   * Place where the users sign up to be registered into the group
   * @component
   * @returns {JSX.Element} - Admin Setup UI
*/
const UserSignup = () => {
  // States for user info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [groupCode, setGroupCode] = useState('');
  // States for success and error messages
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  {/*Handles submission and puts user in proper group*/}
  const handleSubmit = async (event) => {
  event.preventDefault();
  setErrorMessage('');
  setSuccessMessage('');

  try {
    const enteredCode = String(groupCode).trim(); 
    if (!enteredCode) throw new Error("Group code is required");
    console.log("Entered code (string):", enteredCode, typeof enteredCode);

    const adminCodesRef = doc(db, 'Config', 'adminCodes');
    const adminCodesSnap = await getDoc(adminCodesRef);
    
    if (!adminCodesSnap.exists()) {
      throw new Error("System configuration error - contact support");
    }

    const adminCodesData = adminCodesSnap.data();
    console.log("Admin codes data:", adminCodesData);

    const validGroupCodes = Object.values(adminCodesData).map(String);
    console.log("Valid group codes:", validGroupCodes);

    if (!validGroupCodes.includes(enteredCode)) {
      throw new Error("Invalid group code - please check with your administrator");
    }

    console.log("Valid group code confirmed:", enteredCode);

    const groupRef = doc(db, 'groups', enteredCode);
    const groupSnap = await getDoc(groupRef);

    if (!groupSnap.exists()) {
      throw new Error(`Group ${enteredCode} not found - contact administrator`);
    }

    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;

    await setDoc(doc(db, 'groups', enteredCode, 'users', uid), {
      firstName,
      lastName,
      email,
      phoneNumber,
      role: 'User',
      createdAt: new Date()
    });

    setSuccessMessage("Registration successful! Redirecting...");
    setTimeout(() => window.location.href = '/login', 2000);

  } catch (error) {
    console.error("Registration error:", error);
    
    let errorMsg = "Registration failed - please try again";
    if (error.code === 'auth/email-already-in-use') {
      errorMsg = "Email already registered";
    } else if (error.message.includes("group code")) {
      errorMsg = error.message;
    }
    
    setErrorMessage(errorMsg);
    
    if (auth.currentUser) {
      try {
        await auth.currentUser.delete();
      } catch (cleanupError) {
        console.error("Cleanup failed:", cleanupError);
      }
    }
  }
};

  {/*Main Component UI*/}
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '160vh',
      padding: '15px',
      paddingTop: '10px',
      backgroundColor: '#e3f0ff',
      marginTop: '-10px',
      justifyContent: 'flex-start'
    }}>
      {/* Logo and Page Title */}
      <img 
        src={logo} 
        alt="Logo" 
        style={{
          width: '250px',
          marginBottom: '30px',
          marginTop: '-20px',
          marginLeft: '20px'
        }} 
      />
      <h1
        style={{
          textAlign: 'center',
          fontSize: '1.6em',
          color: '#333',
          fontWeight: 'bold',
          marginBottom: '50px',
          marginTop: '-40px',
          marginLeft: '10px'
        }}
      >
        Sign Up
      </h1>
      {/* Main form for member info*/}
      <form
        id="signupForm"
        onSubmit={handleSubmit}
        style={{
          width: '420px',
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          padding: '36px 32px 32px 32px',
          margin: '0 auto',
          scale: '0.73',
          marginLeft: '-20px',
          marginTop: '-120px',
          maxHeight: '550px'
        }}
      >
        {/* Form fields remain exactly as in your original component */}
        <div className="form-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '5px', marginTop: '-30px'}}>
          <label htmlFor="FirstName" style={{
            width: '130px',
            minWidth: '130px',
            marginRight: '10px',
            fontSize: '15px',
            color: '#555',
            textAlign: 'right',
            whiteSpace: 'nowrap',
          }}>First Name:</label>
          <input
            type="text"
            id="FirstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            style={{
              flex: 1,
              padding: '8px 10px',
              fontSize: '16px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              height: '36px',
              boxSizing: 'border-box',
              marginTop: '20px'
            }}
          />
        </div>
        <div className="form-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
          <label htmlFor="LastName" style={{
            width: '130px',
            minWidth: '130px',
            marginRight: '10px',
            fontSize: '16px',
            color: '#555',
            textAlign: 'right',
            whiteSpace: 'nowrap'
          }}>Last Name:</label>
          <input
            type="text"
            id="LastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            style={{
              flex: 1,
              padding: '8px 10px',
              fontSize: '15px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              height: '36px',
              boxSizing: 'border-box',
              marginTop: '20px'
            }}
          />
        </div>
        <div className="form-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
          <label htmlFor="email" style={{
            width: '130px',
            minWidth: '130px',
            marginRight: '10px',
            fontSize: '16px',
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
            style={{
              flex: 1,
              padding: '8px 10px',
              fontSize: '16px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              height: '36px',
              boxSizing: 'border-box',
              marginTop: '20px'
            }}
          />
        </div>
        <div className="form-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
        <label htmlFor="phoneNumber" style={{
          width: '130px',
          minWidth: '130px',
          marginRight: '10px',
          fontSize: '15px',
          color: '#555',
          textAlign: 'right',
          whiteSpace: 'nowrap',
        }}>Phone Number:</label>
        <input
          type="tel"
          id="phoneNumber"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          required
          style={{
            flex: 1,
            padding: '8px 10px',
            fontSize: '16px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            height: '36px',
            boxSizing: 'border-box',
            marginTop: '20px'
          }}
        />
      </div>
        <div className="form-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
          <label htmlFor="password" style={{
            width: '130px',
            minWidth: '130px',
            marginRight: '10px',
            fontSize: '16px',
            color: '#555',
            textAlign: 'right',
            whiteSpace: 'nowrap'
          }}>Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              flex: 1,
              padding: '8px 10px',
              fontSize: '16px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              height: '36px',
              boxSizing: 'border-box',
              marginTop: '20px'
            }}
          />
        </div>
        <div className="form-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
          <label htmlFor="ConfirmPassword" style={{
            width: '130px',
            minWidth: '135px',
            marginRight: '10px',
            fontSize: '14px',
            color: '#555',
            textAlign: 'right',
            whiteSpace: 'nowrap'
          }}>Confirm Password:</label>
          <input
            type="password"
            id="ConfirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{
              flex: 1,
              padding: '5px 10px',
              fontSize: '15px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              height: '36px',
              boxSizing: 'border-box',
              marginTop: '20px',
              marginRight: '-20pxs'
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label htmlFor="groupCode" style={{
                width: '100px',
                fontSize: '16px',
                color: '#555',
                textAlign: 'right',
                whiteSpace: 'nowrap'
              }}>Group Code:</label>
              <input
                type="text"
                id="groupCode"
                value={groupCode}
                onChange={(e) => setGroupCode(e.target.value)}
                required
                autoComplete="off"
                style={{
                  flex: 1,
                  padding: '10px',
                  fontSize: '18px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  height: '40px',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.3s',
                  marginTop: '10px'
                }}
              />
          </div>

        {/* Submit Button */}
        <button
          type="submit"
          style={{
            width: '40%',
            padding: '10px',
            fontSize: '18px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginTop: '20px',
            marginBottom: '-10px',
            marginLeft: '140px',
            fontWeight: 'bold'
          }}
        >Submit</button>

        {/* Back Button */}
        <button
          type="button"
          style={{
            width: '40%',
            padding: '10px',
            fontSize: '15px',
            backgroundColor: '#007bff',
            color: 'white',
            border: '2px solid #007bff',
            borderRadius: '3px',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginTop: '-32px',
            marginLeft: '-175px'
          }}
          onClick={() => window.location.href = '/signup2'}
        >
          Back
        </button>
      </form>

      {/* Error and Success Messages */}
      {errorMessage && <p id="errorMessage" style={{ marginTop: '-70px', color: 'red' }}>{errorMessage}</p>}
      {successMessage && <p style={{ color: 'green', marginTop: '-70px' }}>{successMessage}</p>}
    </div>
  );
};

export default UserSignup;