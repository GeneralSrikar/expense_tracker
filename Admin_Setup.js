import React, { useState } from 'react';
import './App.css';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from './Firebase';
import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import logo from './images/logo1.png';
import { useNavigate } from 'react-router-dom';

/**
 * Admin Setup component which sets up the first admin's information 
 * @component
 * @returns {JSX.Element} - Admin Setup UI
 */
const AdminSignup = () => {
  // Form state
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [FirstName, setFirstName] = useState('');
  const [LastName, setLastName] = useState('');
  const [ConfirmPassword, setConfirmPassword] = useState('');
  
  // UI state
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const normalizePhone = (number) => number.replace(/\D/g, '');

  {/*First Admin Info Submission*/}
  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    // Validates all fields
    if (!FirstName.trim() || !LastName.trim() || !email.trim() || 
        !phoneNumber.trim() || !password.trim() || !ConfirmPassword.trim()) {
      setErrorMessage('Please fill in all fields.');
      setIsLoading(false);
      return;
    }

    // Validate password match
    if (password !== ConfirmPassword) {
      setErrorMessage('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    // Validates email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage('Please enter a valid email address.');
      setIsLoading(false);
      return;
    }

    // Validates phone number
    const normalizedPhone = normalizePhone(phoneNumber);
    if (normalizedPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit phone number.');
      setIsLoading(false);
      return;
    }

    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      const nameExists = snapshot.docs.some(doc => {
        const data = doc.data();
        return (data.FirstName || '').trim().toLowerCase() === FirstName.trim().toLowerCase();
      });

      const phoneExists = snapshot.docs.some(doc => {
        const data = doc.data();
        return data.phoneNumber && normalizePhone(data.phoneNumber) === normalizedPhone;
      });

      if (nameExists) {
        throw new Error('An admin with this first name already exists.');
      }
      if (phoneExists) {
        throw new Error('This phone number is already registered.');
      }

    
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      
      await setDoc(doc(db, 'users', user.uid), {
        FirstName: FirstName.trim(),
        LastName: LastName.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: normalizedPhone,
        Role: 'Admin',
        createdAt: new Date()
      });

      setSuccessMessage('Admin account created successfully! Redirecting...');
      setTimeout(() => navigate('/initial-setup'), 2000);

    } catch (error) {
      console.error('Signup error:', error);
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          setErrorMessage('This email is already registered.');
          break;
        case 'auth/weak-password':
          setErrorMessage('Password should be at least 6 characters.');
          break;
        case 'auth/invalid-email':
          setErrorMessage('Please enter a valid email address.');
          break;
        default:
          setErrorMessage(error.message || 'An error occurred during signup.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginClick = () => navigate('/login');

  {/* Main Component */}
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
          marginBottom: '50px',
          marginTop: '-15px',
          marginLeft: '30px'
        }} 
      />
      <h1
        style={{
          textAlign: 'center',
          fontSize: '1.5em',
          color: '#333',
          fontWeight: 'bold',
          marginBottom: '65px',
          marginTop: '-50px',
          marginLeft: '0px'
        }}
      >
        Admin Setup
      </h1>

      {/* Main form with text fields */}
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
          scale: '0.80',
          marginLeft: '-28px',
          marginTop: '-108px',
          maxHeight: '600px'
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

        {/* Back Button to initial admin sign up page*/}
        <button type="button" style={{
          width: '40%',
          padding: '10px',
          fontSize: '16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '20px',
          marginRight: '150px',
          marginBottom: '-20px',
          fontWeight: 'bold'
        }}
        onClick={() => navigate('/initial-admin-signup')}
        >Back</button>

        {/* Submit button */}
        <button
          type="submit"
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
            fontWeight: 'bold'
          }}
        >
          Submit
        </button>

      {/* Success and Error messages */}
      </form>
      {errorMessage && <p id="errorMessage" style = {{marginTop: '-60px'}}>{errorMessage}</p>}
      {successMessage && <p style={{ color: 'green', marginTop: '-40px' }}>{successMessage}</p>}
    </div>
  );
};

export default AdminSignup;