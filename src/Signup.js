import React, { useState } from 'react';
import './App.css';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db} from './Firebase';
import { doc, setDoc, getDocs, collection, where, query} from 'firebase/firestore';
import logo from './images/logo1.png';
const Signup = () => {
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [FirstName, setFirstName] = useState('');
  const [LastName, setLastName] = useState('');
  const [ConfirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [groupCode, setGroupCode] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const GroupCode = 'ABD';
  const AdminCode = '666777';
  // Add useNavigate for navigation
  const navigate = window.reactRouterNavigate || (() => {}); // fallback for environments without react-router
  // If using react-router-dom v6+, use:
  // import { useNavigate } from 'react-router-dom';
  // const navigate = useNavigate();

const handleSubmit = async (event) => {
  event.preventDefault();
  setErrorMessage('');
  setSuccessMessage('');

  if (groupCode.trim().toUpperCase() !== GroupCode) {
    setErrorMessage("Invalid Group Code. Please check with your admin!");
    return;
  }
  if (password !== ConfirmPassword) {
    setErrorMessage('Passwords do not match.');
    return;
  }

  // Duplicate name and phone number check (case-insensitive, trimmed)
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    const normalizedFirst = FirstName.trim().toLowerCase();
    const normalizedPhone = phoneNumber.replace(/\D/g, '');

    let firstNameExists = false;
    let phoneExists = false;

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const docFirst = (data.FirstName || '').trim().toLowerCase();
      const docPhone = (data.phoneNumber || '').replace(/\D/g, '');

      if (docFirst === normalizedFirst) firstNameExists = true;
      if (docPhone && docPhone === normalizedPhone) phoneExists = true;
    });

    if (firstNameExists) {
      setErrorMessage('There is already someone with the same first name as you. Please change it.');
      return;
    }
    if (phoneExists) {
      setErrorMessage('There is already someone with the same phone number as you. Please change it.');
      return;
    }
  } catch (error) {
    setErrorMessage('Error checking for duplicate names or phone number.');
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await setDoc(doc(db, 'users', user.uid), {
      FirstName,
      LastName,
      email,
      phoneNumber,
      Role: 'User'
    });
    setSuccessMessage('Signup successful! Redirecting to login ...');
    setErrorMessage('');
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
  } catch (error) {
    console.error('Error during signup:', error);
    setErrorMessage("Email is already in use!");
  }
};
  // Handler for Login button
  const handleLoginClick = (e) => {
    e.preventDefault();
    window.location.href = '/login';
    // Or if using react-router: navigate('/login');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '160vh',
      padding: '15px',
      paddingTop: '10px',
      backgroundColor: '#e3f0ff', // Changed background color
      marginTop: '-10px',
      justifyContent: 'flex-start'
    }}>
      <img 
        src={logo} 
        alt="Logo" 
        style={{
          width: '270px',
          marginBottom: '30px',
          marginTop: '-30px',
          marginLeft: '30px'
        }} 
      />
      <h1
        style={{
          textAlign: 'center',
          fontSize: '2.0em',
          color: '#333',
          fontWeight: 'bold',
          marginBottom: '55px',
          marginTop: '-60px',
          marginLeft: '10px'
        }}
      >
        Sign Up
      </h1>
      <form
        id="signupForm"
        onSubmit={handleSubmit}
        style={{
          // Remove scale transforms for better layout
          width: '420px',
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          padding: '36px 32px 32px 32px',
          margin: '0 auto',
          scale: '0.75',
          marginLeft: '-25px',
          marginTop: '-108px',
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
              <label htmlFor="groupCode" style={{
                width: '100px',
                fontSize: '16px',
                color: '#555',
                textAlign: 'right',
              }}>GroupCode:</label>
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
        <button type="submit" style={{
          width: '40%',
          padding: '10px',
          fontSize: '15px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '20px',
          marginRight: '150px',
          marginBottom: '-20px'
        }}>Sign Up</button>
        <button
          type="button"
          onClick={handleLoginClick}
          style={{
            width: '40%',
            padding: '10px',
            fontSize: '16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '-20px',
            marginBottom: '-10px',
            marginLeft: '160px',
            fontWeight: 'bold' // Make the text bold
          }}
        >Login</button>
      </form>
      {errorMessage && <p id="errorMessage" style = {{marginTop: '-60px'}}>{errorMessage}</p>}
      {successMessage && <p style={{ color: 'green', marginTop: '-60px' }}>{successMessage}</p>}
    </div>
  );
};

export default Signup;