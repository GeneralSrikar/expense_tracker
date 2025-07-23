import React, { useState, useEffect } from 'react';
import './App.css';
import { useNavigate } from 'react-router-dom';
import logo from './images/logo1.png';
import { signOut } from 'firebase/auth';
import { auth, db } from './Firebase';
import { collection, addDoc, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
/**
 * Add Component which allows admin to add a member to the group
 * @component
 * @returns {JSX.Element} - Add UI
 */
const normalizePhone = (number) => number.replace(/\D/g, '');
const isValidPhone = (phone) => /^\d{10}$/.test(normalizePhone(phone));
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const Add = () => {
  const navigate = useNavigate();
  // States to add the member's info
  const [FirstName, setFirstName] = useState('');
  const [LastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  // States to track logged-in user's info
  const [userFirstName, setUserFirstName] = useState('');
  const [userGroupId, setUserGroupId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Success Message State
  const [successMessage, setSuccessMessage] = useState('');

  {/*Gets info on the logged-in user -> First Name and groupID*/}
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
          console.error('Error fetching user first name or group:', error);
        }
      }
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  {/*Clear success message after 3 seconds*/}
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  {/*Handle Logout*/}
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };
  {/*Checks duplicate info when adding member*/}
  const checkExistingUser = async () => {
    try {
      const usersRef = collection(db, 'users');
      const normalizedPhone = normalizePhone(phoneNumber);
      const normalizedEmail = email.toLowerCase().trim();

      const [phoneSnapshot, emailSnapshot] = await Promise.all([
        getDocs(query(usersRef, where('phoneNumber', '==', normalizedPhone))),
        getDocs(query(usersRef, where('email', '==', normalizedEmail)))
      ]);

      if (!phoneSnapshot.empty && !emailSnapshot.empty) {
        return "Both phone number and email already exist";
      }
      if (!phoneSnapshot.empty) {
        return "Phone number already exists";
      }
      if (!emailSnapshot.empty) {
        return "Email already exists";
      }
      return null;
    } catch(error) {
      console.error('Error checking existing user:', error);
      return 'Error checking existing user';
    }
  };
  {/*Handles Submission to add a group member after making validity checks*/}
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!FirstName || !LastName || !phoneNumber || !email || !amount) {
      alert('Please fill out all fields before submitting');
      setIsSubmitting(false);
      return;
    }

    if (!isValidPhone(phoneNumber)) {
      alert('Please enter a valid 10-digit phone number!');
      setIsSubmitting(false);
      return;
    }

    if (!isValidEmail(email)) {
      alert('Please enter a valid email!');
      setIsSubmitting(false);
      return;
    }

    if (isNaN(parseFloat(amount))) {
      alert('Please enter a valid amount!');
      setIsSubmitting(false);
      return;
    }

    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const normalizedInput = FirstName.trim().toLowerCase();
      const duplicate = snapshot.docs.some(doc =>
        (doc.data().FirstName || '').trim().toLowerCase() === normalizedInput
      );
      const duplicateMessage = await checkExistingUser();
      if(duplicateMessage){
        alert(duplicateMessage);
        setIsSubmitting(false);
        return
      }
      if (duplicate) {
        alert('There is already someone with the same first name as you. Please change it.');
        setIsSubmitting(false);
        return;
      }
    } catch (error) {
      alert('Error checking for duplicate names.');
      setIsSubmitting(false);
      return;
    }

    try {
      const normalizedPhone = normalizePhone(phoneNumber);
      const normalizedEmail = email.toLowerCase().trim();

      if (!userGroupId) {
        alert('Could not determine your group.');
        setIsSubmitting(false);
        return;
      }

      await addDoc(collection(db, 'groups', userGroupId, 'users'), {
        FirstName,
        LastName,
        phoneNumber: normalizedPhone,
        email: normalizedEmail,
        amount: parseFloat(amount),
        createdAt: new Date(),
        Role: 'User'
      });

      setSuccessMessage('Member added successfully!');
      setFirstName('');
      setLastName('');
      setPhoneNumber('');
      setEmail('');
      setAmount('');
    } catch (error) {
      console.error('Error adding member:', error);
      alert(`Failed to add member: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHomeClick = () => {
    navigate('/home');
  };
  // Main Component UI
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: 'skyblue',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Logo Image */}
      <img
        src={logo}
        alt="Logo"
        style={{ display: 'block', maxWidth: '250px', height: 'auto', marginTop: '-5px' }}
      />
      <h1 style={{ textAlign: 'center', marginTop: '-10px', fontWeight: 800, fontSize: '1.5em' }}>
        Add a Member
      </h1>
      {/* Form which includes all fields that need to be filled out to add a member */}
      <form
        style={{
          marginTop: '10px',
          width: '80%',
          maxWidth: '500px',
          display: 'flex',
          flexDirection: 'column',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          padding: '32px',
          transform: 'scale(0.93)',
          transformOrigin: 'top center',
        }}
        onSubmit={handleSubmit}
      >
        {[
          { id: 'firstName', label: 'First Name', value: FirstName, setter: setFirstName },
          { id: 'lastName', label: 'Last Name', value: LastName, setter: setLastName },
          { id: 'phoneNumber', label: 'Phone', value: phoneNumber, setter: setPhoneNumber },
          { id: 'email', label: 'Email', value: email, setter: setEmail },
          { id: 'amount', label: 'Amount', value: amount, setter: setAmount, type: 'number' },
        ].map(({ id, label, value, setter, type = 'text' }) => (
          <div
            key={id}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              marginBottom: '10px',
            }}
          >
            <label
              htmlFor={id}
              style={{
                width: '100px',
                fontWeight: 500,
                marginRight: '10px',
                textAlign: 'right',
              }}
            >
              {label}:
            </label>
            <input
              id={id}
              type={type}
              placeholder={`Enter ${label.toLowerCase()}`}
              value={value}
              onChange={(e) => setter(e.target.value)}
              style={{
                flex: 1,
                padding: '6px 12px',
                height: '32px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '14px',
              }}
            />
          </div>
        ))}

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            marginTop: '10px',
          }}
        >
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '0px 21px',
              backgroundColor: isSubmitting ? '#cccccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
            }}
          >
            {isSubmitting ? 'Adding...' : 'Submit'}
          </button>
          <button
            type="button"
            onClick={handleHomeClick}
            style={{
              padding: '10px 21px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => navigate('/members')}
            style={{
              padding: '10px 21px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Member List
          </button>
        </div>
      </form>
      {/* Welcome message and logout option */}
      <div
        style={{
          position: 'absolute',
          right: '30px',
          top: '40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
        }}
      >
        <span
          style={{
            fontSize: '1.0em',
            color: '#333',
            fontWeight: 600,
            letterSpacing: '0.5px',
            marginTop: '-25px',
            marginRight: '-10px'
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
            fontSize: '1.1em',
            marginTop: '2px',
            marginRight: '-10px'
          }}
        >
          Logout
        </span>
      </div>
    </div>
  );
};

export default Add;