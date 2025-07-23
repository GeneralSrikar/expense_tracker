import React, { useState, useEffect } from 'react';
import './App.css';
import { useNavigate } from 'react-router-dom';
import logo from './images/logo1.png';
import { signOut } from 'firebase/auth';
import { auth, db } from './Firebase';
import { collection, doc, getDoc, addDoc, onSnapshot, getDocs } from 'firebase/firestore';
/**
 * Attendance component which records all activities that the group does includes
 * activity name, activity date, members, and expense per head
 * @component
 * @returns {JSX.Element} - Attendance UI
 */
const Attendance = () => {
  // React Router's navigation hook
  const navigate = useNavigate();
  // State for checking submission status
  const [isSubmitted, setIsSubmitted] = useState(false);
  // State to fill out activity info
  const [activityName, setActivityName] = useState('');
  const [activityDate, setActivityDate] = useState('');
  const [expensePerHead, setExpensePerHead] = useState('');
  const [members, setMembers] = useState([]);
  const [checked, setChecked] = useState({});
  const [showMembers, setShowMembers] = useState(false);
  const [amount, setAmount] = useState('');
  // State to get all first names of group members
  const [FirstName, setFirstName] = useState('');
  // State which finds group of user logged-in
  const [userGroupId, setUserGroupId] = useState(null);
  // State for success message
  const [successMessage, setSuccessMessage] = useState('');

  {/*Sets browser's zoom level to 100%*/}
  useEffect(() => {
    const handleResize = () => {
      document.body.style.zoom = '1';
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(handleResize, 100);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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

  const unsub = onSnapshot(
    collection(db, 'groups', userGroupId, 'users'),
    (snapshot) => {
      const membersList = snapshot.docs.map(doc => ({
        id: doc.id,
        firstName: doc.data().FirstName, 
        ...doc.data(),
      }));
      setMembers(membersList);
    }
  );
  return () => unsub();
}, [userGroupId]);

  {/*Calculate per-head expense*/}
  useEffect(() => {
    const selectedMembers = Object.values(checked).filter(Boolean).length;
    if (selectedMembers > 0 && amount) {
      setExpensePerHead((parseFloat(amount) / selectedMembers).toFixed(2));
    } else {
      setExpensePerHead('');
    }
  }, [amount, checked]);

  const handleCheckboxChange = (id) => {
    setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  };
  {/*Handles Logout*/}
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };
  {/*Handles Submit after checking validity*/}
  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    if (!userGroupId) {
      alert('Could not determine your group. Please try again later.');
      return;
    }
    if (activityName == '' || activityDate == '' || amount == '') {
      alert("You have one or more fields incomplete");
      return;
    }
    if (!Object.values(checked).some(Boolean)) {
      alert("Please select at least one member.");
      return;
    }

    const formattedDate = activityDate;
    const checkedNames = members
      .filter(member => checked[member.id])
      .map(member => member.firstName || member.FirstName || member.name || 'Unknown');

    await addDoc(collection(db, 'groups', userGroupId, 'transactions'), {
      activityName: activityName,
      activityDate: formattedDate,
      totalExpense: parseFloat(amount),
      expensePerHead: parseFloat(expensePerHead),
      membersChecked: checkedNames, 
      createdAt: new Date()
    });

    setActivityName('');
    setActivityDate('');
    setAmount('');
    setExpensePerHead('');
    setChecked({});
    setSuccessMessage('Attendance recorded successfully!');
    setTimeout(() => {
      setSuccessMessage('');
    }, 2500);
    setIsSubmitted(true);
  } catch (e) {
    console.error("Error adding document: ", e);
    alert("Failed to save attendance record.");
  }
}

  useEffect(() => {
    if (isSubmitted) {
      alert('Attendance recorded successfully!');
    }
  }, [isSubmitted]);

  {/*Main Component*/}
  return (
    <div className="attendance-container" style={{ 
      background: '#ffffe0',
      minHeight: '100vh', 
      paddingTop: '0', 
      position: 'relative', 
      scale: '1',
      overflowX: 'hidden',
    }}>
    {/*Logo and Page Title */}
      <div style={{ paddingTop: isSubmitted ? '30px' : '0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '-10px' }}>
          <img src={logo} alt="Logo" style={{ maxWidth: '250px', height: 'auto', marginBottom: '-30px', marginTop: '-10px' }} />
          <h2 style={{ fontSize: '1.6em', color: '#333', margin: '0 0 10px 0', marginTop: '30px', marginBottom: '15px', fontWeight: '600' }}>Attendance</h2>
        </div>
        {/* Displays all the member's first names with checkboxes next to them */}
        {showMembers && (
          <div style={{
            position: 'fixed', top: '140px', left: '40px', border: '2px solid #007bff', borderRadius: '10px', padding: '20px',
            background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '320px', minHeight: '300px', zIndex: 10,
            marginTop: '60px', marginLeft: '-20px'
          }}>
            <h3 style={{ marginTop: 0, textAlign: 'center', marginBottom: '40px', fontWeight: '500', textDecoration: 'underline' }}>Current Members</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '-25px' }}>
              {members.map((member) => (
                <label key={member.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#555' }}>
                  <input
                    type="checkbox"
                    checked={!!checked[member.id]}
                    onChange={() => handleCheckboxChange(member.id)}
                    style={{ width: '20px', height: '20px', cursor: 'pointer', marginLeft: '25px' }}
                  />
                  <span style={{ marginTop: '-15px' }}>{member.firstName || 'N/A'}</span>
                </label>
              ))}
            </div>
            {/*Back button to return to original Attendance screen*/}
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <button
                type="button"
                onClick={() => setShowMembers(false)}
                style={{ backgroundColor: '#007bff', color: '#fff', border: 'none', padding: '8px 32px', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', marginTop: '100px' }}
              >
                Back
              </button>
            </div>
          </div>
        )}
        {/*Attendance Form Container */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '160%' }}>
          <div style={{
            border: '2px solid #ccc', borderRadius: '16px', padding: '32px 32px 24px 32px', width: '100%', maxWidth: '900px', minWidth: '550px', marginTop: '-90px',
            minHeight: '600px', maxHeight: '540px', background: 'white', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start',
            position: 'relative', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)', transform: 'scale(0.68)'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', flex: 1, justifyContent: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ minWidth: '50px', textAlign: 'right', fontSize: '18px' }}>Activity Name:</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Enter activity name"
                  value={activityName}
                  onChange={e => setActivityName(e.target.value)}
                  style={{ flex: 1, padding: '10px', fontSize: '16px' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ minWidth: '120px', textAlign: 'right', fontSize: '18px'  }}>Date:</label>
                <input
                  type="date"
                  className="input-field"
                  value={activityDate}
                  onChange={e => setActivityDate(e.target.value)}
                  style={{ flex: 1, padding: '18px 12px', fontSize: '16px', height: '35px' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ minWidth: '120px', textAlign: 'right', fontSize: '18px'  }}>Total Expense:</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="Enter total amount"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  style={{ flex: 1, padding: '10px', fontSize: '16px' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
                <label style={{ minWidth: '120px', textAlign: 'right', fontSize: '18px'  }}>Expense/Head:</label>
                <input
                  type="text"
                  className="input-field"
                  value={expensePerHead}
                  disabled
                  style={{ flex: 1, padding: '10px', backgroundColor: '#f7f7f7', fontSize: '18px', fontWeight: 'bold' }}
                />
              </div>
            </div>
            {/* Success message for confirmation after submission */}
            {successMessage && (
              <div style={{
                color: 'green',
                background: '#e6ffe6',
                border: '1px solid #b2ffb2',
                borderRadius: '6px',
                padding: '10px 20px',
                margin: '70px auto 20px auto',
                textAlign: 'center',
                fontWeight: 'bold',
                width: 'fit-content',
                marginBottom: '0px'
              }}>
                {successMessage}
              </div>
            )}
            {/* Form action buttons: Members, Submit, and Home */}
            <form onSubmit={handleSubmit} style={{
              position: 'absolute', bottom: '90px', left: '50%', transform: 'translateX(-50%)', width: '90%', display: 'flex',
              flexDirection: 'row', justifyContent: 'center', columnGap: '40px', background: 'none', boxShadow: 'none'
            }}>
              <button type="button" onClick={() => setShowMembers(prev => !prev)} style={{ backgroundColor: '#007bff', color: '#fff', border: 'none', padding: '10px 30px', borderRadius: '6px', cursor: 'pointer', fontSize: '18px', transition: 'background-color 0.3s', marginTop: '-20px', fontWeight: 'bold', marginBottom: '-30px' }}>Members</button>
              <button type="submit" style={{ backgroundColor: '#007bff', color: '#fff', border: 'none', padding: '10px 40px', borderRadius: '6px', cursor: 'pointer', fontSize: '18px', transition: 'background-color 0.3s', marginTop: '-20px', fontWeight: 'bold', marginBottom: '-30px'}}>Submit</button>
              <button type="button" onClick={() => navigate('/')} style={{ backgroundColor: '#007bff', color: '#fff', border: 'none', padding: '10px 40px', borderRadius: '6px', cursor: 'pointer', fontSize: '18px', transition: 'background-color 0.3s', marginTop: '-20px', fontWeight: 'bold', marginBottom: '-30px'}}>Home</button>
            </form>
          </div>
        </div>
        {/*Welcome message and Logout*/}
        <div style={{ position: 'absolute', right: '30px', top: '30px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', zIndex: 10 }}>
          <span className="user-name" style={{ alignSelf: 'flex-end', marginRight: '-15px', marginTop: '-15px', fontSize: '0.9em', color: '#333', fontWeight: 600, letterSpacing: '0.5px' }}>Welcome, {FirstName ? FirstName : 'User'}!</span>
          <span onClick={handleLogout} style={{ color: 'grey', cursor: 'pointer', textDecoration: 'underline', fontSize: '1.1em', background: 'none', border: 'none', padding: 0, marginTop: '2px', marginRight: '-15px', alignSelf: 'flex-end' }}>Logout</span>
        </div>
      </div>
    </div>
  );
};

export default Attendance;