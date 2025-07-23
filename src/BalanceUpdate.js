import React, { useState, useEffect } from 'react';
import './App.css';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from './Firebase';
import { collection, addDoc, onSnapshot, updateDoc, doc, getDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import logo from './images/logo1.png';
/**
 * Balance Update component which allows the admin to make transactions
 * on behalf of the other members in the group
 * @component
 * @returns {JSX.Element} - Balance Update UI
 */
const BalanceUpdate = () => {
  const navigate = useNavigate();
  // States present on the transaction form
  const [actionType, setActionType] = useState('');
  const [balance, setBalance] = useState('');
  const [reason, setReason] = useState('');
  const [currentBalance, setCurrentBalance] = useState(0);
  const [members, setMembers] = useState([]);
  // Success and Error Messages
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  // State for Logged-in user's info
  const [FirstName, setFirstName] = useState('');
  const [userGroupId, setUserGroupId] = useState(null);
  const [selectedMemberId, setSelectedMemberId] = useState('');


  {/*Fetch user data and group ID*/}
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const groupsSnapshot = await getDocs(collection(db, 'groups'));
          for (const groupDoc of groupsSnapshot.docs) {
            const userDoc = await getDoc(doc(db, 'groups', groupDoc.id, 'users', user.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setFirstName(userData.FirstName);
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

  {/*Load members from the user's group*/}
  useEffect(() => {
    if (!userGroupId) return;

    const unsubMembers = onSnapshot(
      collection(db, 'groups', userGroupId, 'users'),
      (snapshot) => {
        const membersList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMembers(membersList);
      }
    );

    return () => unsubMembers();
  }, [userGroupId]);

  {/*Update current balance when selected member changes*/}
  useEffect(() => {
    if (selectedMemberId) {
      const member = members.find(m => m.id === selectedMemberId);
      const balanceValue = member?.amount || 0;
      setCurrentBalance(balanceValue);
    } else {
      setCurrentBalance(0);
    }
  }, [selectedMemberId, members]);

  {/*Handles Logout*/}
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
  };
 {/* Handles Submission after checks */}
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!userGroupId) {
      setErrorMessage('Could not determine your group. Please try again later.');
      return;
    }

    const numericBalance = parseFloat(balance);

    if (!selectedMemberId || isNaN(numericBalance)) {
      setErrorMessage('Please select a member and enter a valid amount.');
      return;
    }

    try {
      const memberDoc = members.find(m => m.id === selectedMemberId);

      if (!memberDoc) {
        setErrorMessage('Member not found.');
        return;
      }

      const memberId = memberDoc.id;
      const memberName = memberDoc.FirstName || memberDoc.name || memberDoc.firstName || 'Unnamed';

      let newBalance;
      if (actionType === 'add') {
        newBalance = currentBalance + numericBalance;
      } else if (actionType === 'subtract') {
        newBalance = currentBalance - numericBalance;
      } else {
        setErrorMessage('Please select an action type.');
        return;
      }

      const transactionType = actionType === 'add' ? 'credit' : 'debit';
      const transactionAmount = actionType === 'add' ? numericBalance : -numericBalance;

      await updateDoc(doc(db, 'groups', userGroupId, 'users', memberId), {
        amount: newBalance
      });

      await addDoc(collection(db, 'groups', userGroupId, 'balances'), {
        FirstName: memberName,
        memberId: memberId,
        transactionAmount: transactionAmount,
        date: serverTimestamp(),
        event: reason,
        transactionType: transactionType,
        newBalance: newBalance
      });

      setSuccessMessage("You have successfully completed your transaction!");
      setTimeout(() => setSuccessMessage(''), 2500);
      setSelectedMemberId('');
      setBalance('');
      setActionType('');
      setErrorMessage('');
      setReason('');
    } catch (error) {
      console.error('Error submitting data:', error);
      setErrorMessage('Failed to submit data. Please try again.');
    }
  };

  {/*Main Component*/}
  return (
    <div
      className="attendance-container"
      style={{
        minHeight: '100vh',
        background: '#eafaf1', 
        padding: '0',
        margin: '0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        overflow: 'hidden'
      }}
    >
      {/*Logo and page title */}
      <img
        src={logo}
        alt="Logo"
        style={{
          display: 'block',
          margin: '0 auto 0 auto',
          maxWidth: '250px',
          height: 'auto',
          position: 'static',
          marginBottom: '0px',
          marginTop: '-10px'
        }}
      />
      <h2 style={{
        fontSize: '1.4em',
        color: '#333',
        margin: '20px 0 30px 0',
        fontWeight: 'bold',
        marginTop: '10px',
        marginBottom: '-40px'
      }}>
        Balance Update
      </h2>
      {/* Form Section */}
      <div style={{
        borderRadius: '8px',
        padding: '20px 32px',
        minWidth: '320px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: '15px',
        position: 'relative',
        marginRight: '0px',
        scale: 0.95
      }}>
        {/* Member Dropdown */}
        <form onSubmit={handleSubmit} style={{ width: '180%' }}>
          <div style={{display: 'flex', alignItems: 'center', marginBottom: '7px', gap: '10px'}}>
            <label htmlFor="name" style={{minWidth: '50px', marginTop: '5px'}}>Member Name:</label>
        <select
          id="name"
          value={selectedMemberId}
          onChange={(e) => setSelectedMemberId(e.target.value)}
          required
          style={{ flex: 1, minWidth: '200px', height: '30px', fontSize: '16px' }}
        >
          <option value="">Select a Member</option>
          {members.map((member) => {
          const displayName =
            member.FirstName || member.firstName || member.name || `Member ${member.id.substring(0, 4)}`;
          return (
            <option key={member.id} value={member.id}>
              {displayName}
            </option>
          );
        })}
        </select>
          {/* Current Balance Display */}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '20px', gap: '10px' }}>
            <label htmlFor="current-balance" style={{ minWidth: '100px', fontWeight: 'bold' }}>
              Current Balance:
            </label>
            <input
              id="current-balance"
              type="text"
              readOnly
              value={`$${currentBalance.toFixed(2)}`}
              style={{
                backgroundColor: '#f5f5f5',
                border: '1px solid #ccc',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '16px',
                width: '150px',
                color: '#333',
                marginTop: '20px'
              }}
            />
          </div>
          {/* Amount Input */}
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '29px', gap: '10px' }}>
            <label htmlFor="balance" style={{ minWidth: '30px', fontSize: '17px', marginTop: '10px', gap: '10px' }}>
              Enter Amount:
            </label>
            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              min="0.01"
              step="0.01"
              style={{
                WebkitAppearance: 'none',
                MozAppearance: 'textfield',
                appearance: 'none',
                margin: 0,
                padding: '6px 12px',
                fontSize: '16px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                width: '150px'
              }}
              required
            />
          </div>
          {/* Action Type */}
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '30px', marginBottom: '10px', gap: '10px' }}>
            <label htmlFor="actionType" style={{ fontSize: '16px', minWidth: '100px' }}>
              Activity Type:
            </label>
            <select
              id="actionType"
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
              style={{
                padding: '6px 12px',
                fontSize: '14px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                width: '180px'
              }}
              required
            >
              <option value="">Select Action</option>
              <option value="add">Credit</option>
              <option value="subtract">Debit</option>
            </select>
          </div>
          {/* Reason Input */}
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '20px', gap: '0px' }}>
            <label htmlFor="reason" style={{ minWidth: '100px', fontSize: '16px', marginTop: '0', marginLeft: '0' }}>
              Reason:
            </label>
            <input
              id="reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason"
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '6px 10px',
                fontSize: '14px',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
              required
            />
          </div>
          {/* Success Message */}
          {successMessage && (
            <div style={{
              color: 'green',
              background: '#e6ffe6',
              border: '1px solid #b2ffb2',
              borderRadius: '6px',
              padding: '10px 20px',
              margin: '20px auto',
              textAlign: 'center',
              fontWeight: 'bold',
              width: 'fit-content'
            }}>
              {successMessage}
            </div>
          )}
          {/* Submit + Navigation Buttons */}
          <div style={{ display: 'flex', flexDirection: 'row', gap: '16px', alignItems: 'center', justifyContent: 'center', marginTop: '16px', fontSize: '14px', fontWeight: 'bold' }}>
            <button type="submit">Submit</button>
            <button
              type="button"
              className="bottom-button"
              onClick={() => handleNavigation('/home')}
            >
              Home
            </button>
          </div>
        </form>
        {/* Error Message */}
        {errorMessage && <p className="error-message">{errorMessage}</p>}
      </div>
      {/* Welcome Message and Logout Option*/}
      <div style={{
        position: 'absolute',
        right: '30px',
        top: '30px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        zIndex: 10
      }}>
        <span style={{
          alignSelf: 'flex-end',
          marginRight: '-20px',
          marginTop: '-15px',
          fontSize: '0.9em',
          color: '#333',
          fontWeight: 600,
          letterSpacing: '0.5px'
        }}>
          Welcome, {FirstName ? FirstName : 'User'}!
        </span>
        <span
          className="logout-link"
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
            marginRight: '-18px',
            alignSelf: 'flex-end'
          }}
        >
          Logout
        </span>
      </div>
    </div>
  );
};

export default BalanceUpdate;