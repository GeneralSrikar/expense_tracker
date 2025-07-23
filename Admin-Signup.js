  import React, { useState } from 'react';
  import './App.css';
  import { createUserWithEmailAndPassword } from 'firebase/auth';
  import { auth, db } from './Firebase';
  import { doc, setDoc, getDocs, getDoc, collection } from 'firebase/firestore';
  import logo from './images/logo1.png';

  /**
   * Place where the admins, after 1st one, sign up to be registered into the group
   * @component
   * @returns {JSX.Element} - Admin Setup UI
   */
  const AdminSignup = () => {
    // Admin information fields
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [FirstName, setFirstName] = useState('');
    const [LastName, setLastName] = useState('');
    const [ConfirmPassword, setConfirmPassword] = useState('');
    // Error and Success Messages
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    // Used for to authenticate validitiy for admin
    const [adminCode, setAdminCode] = useState('');
  
  {/*Handles the Submission and puts admin in proper group based on input*/}
  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    let groupId = '';

    try {
      const adminCodesRef = doc(db, 'Config', 'adminCodes');
      const adminCodesDoc = await getDoc(adminCodesRef);

      if (!adminCodesDoc.exists()) {
        setErrorMessage("Admin codes configuration missing");
        return;
      }

      const adminCodesData = adminCodesDoc.data();
      
      if (!Object.keys(adminCodesData).includes(adminCode.toString())) {
        setErrorMessage("Invalid Admin Code");
        return;
      }
      
      groupId = adminCodesData[adminCode].toString();
    } catch (error) {
      console.error("Admin code check failed:", error);
      setErrorMessage("System error validating admin code");
      return;
    }

    if (password !== ConfirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    try {
      const usersRef = collection(db, 'groups', groupId, 'users');
      const snapshot = await getDocs(usersRef);
      
      const normalizedPhone = phoneNumber.replace(/\D/g, '');
      const normalizedEmail = email.trim().toLowerCase();

      let emailExists = false;
      let phoneExists = false;

      snapshot.forEach(doc => {
        const user = doc.data();
        const userPhone = (user.phoneNumber || '').replace(/\D/g, '');
        const userEmail = (user.email || '').trim().toLowerCase();

        if (userEmail === normalizedEmail) emailExists = true;
        if (userPhone && userPhone === normalizedPhone) phoneExists = true;
      });

      if (emailExists) {
        setErrorMessage('Email already registered');
        return;
      }
      if (phoneExists) {
        setErrorMessage('Phone number already in use');
        return;
      }
    } catch (error) {
      console.error("Duplicate check failed:", error);
      setErrorMessage('Error checking for existing users');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'groups', groupId, 'users', user.uid), {
        firstName: FirstName,
        lastName: LastName,
        email: email.toLowerCase(),
        phoneNumber: phoneNumber,
        role: 'Admin',
        createdAt: new Date()
      });

      setSuccessMessage('Admin account created! Redirecting...');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);

    } catch (error) {
      console.error("Signup error:", error);
      setErrorMessage(
        error.code === 'auth/email-already-in-use' 
          ? 'Email already registered' 
          : 'Account creation failed'
      );
    }
  };

    {/*Handler for Login button*/}
    const handleLoginClick = (e) => {
      e.preventDefault();
      window.location.href = '/login';
    };

    {/*Main Component*/}
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '160vh',
        padding: '15px',
        paddingTop: '20px',
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
            marginTop: '-30px',
            marginLeft: '30px'
          }} 
        />
        <h1
          style={{
            textAlign: 'center',
            fontSize: '1.6em',
            color: '#333',
            fontWeight: 'bold',
            marginBottom: '40px',
            marginTop: '-40px',
            marginLeft: '10px'
          }}
        >
          Sign Up
        </h1>
        {/* Main Form  with relevant fields*/}
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
            scale: '0.75',
            marginLeft: '-20px',
            marginTop: '-105px',
            maxHeight: '550px'
          }}
        >
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
              value={FirstName}
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
              value={LastName}
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
              value={ConfirmPassword}
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
            <label htmlFor="adminCode" style={{
              width: '100px',
              fontSize: '16px',
              color: '#555',
              textAlign: 'right',
            }}>AdminCode:</label>
            <input
              type="text"
              id="adminCode"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
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
        {/* Navigation Buttons */}
        </div>
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
            onClick={() => window.location.href = '/Signup2'}
          >
            Back
          </button>
        </form>
        {/*Success and Error Messages*/}
        {errorMessage && <p id="errorMessage" style = {{marginTop: '-65px', marginLeft: '10px', color: 'red'}}>{errorMessage}</p>}
        {successMessage && <p style={{ color: 'green', marginTop: '-70px' }}>{successMessage}</p>}
      </div>
    );
  };

  export default AdminSignup;