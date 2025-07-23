import React, { useState, useEffect } from 'react';
import './App.css';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from './Firebase';
import { addDoc, collection, getDocs, query, orderBy, doc, getDoc, Timestamp } from 'firebase/firestore';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import logo from './images/logo1.png';
/**
 * Game History component which allows the admin to view the games that have occurred and they can
 * filter by day, month, year, person, or even name of the event
 * @component
 * @returns {JSX.Element} - The Game History UI
 */ 
const GameHistory = () => {
  // React Router's navigation hook
  const navigate = useNavigate();
  // Stores filtered activity records
  const [activities, setActivities] = useState([]);
  // Allows to seperate by member 
  const [memberName, setMemberName] = useState('');
  // Error message display state
  const [errorMessage, setErrorMessage] = useState('');
  // Logged-in user's first name
  const [firstName, setFirstName] = useState('');
  //Tracks loading state
  const [userGroupId, setUserGroupId] = useState(null);
  const [loading, setLoading] = useState(true);
  // Date, Member, and Event filter option
  const [filterOption, setFilterOption] = useState('all');
  const [filterMember, setFilterMember] = useState('all');
  const [filterEvent, setFilterEvent] = useState('all');
  const [selectedDate, setSelectedDate] = useState(null);
  // List of all member first names
  const [allMembers, setAllMembers] = useState([]);
  // Toggle for displaying all activities
  const [showAllActivities, setShowAllActivities] = useState(false);

  {/*Converts a Firestore Timestamp or date string into MM/DD/YYYY format*/}
  const formatActivityDate = (activityDate) => {
    if (!activityDate) return 'N/A';
    try {
      let d;
      if (activityDate instanceof Date && !isNaN(activityDate)) {
        d = activityDate;
      }
      else if (activityDate.seconds) {
        d = new Date(activityDate.seconds * 1000);
      }
      else if (typeof activityDate === 'string') {
        d = new Date(activityDate);
      }
        if (!d || isNaN(d)) return 'N/A';
        return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;
    } catch (e) {
      return 'N/A';
    }
  };
  {/*Fetches user, member names, and activity data on mount or when filters change*/}
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
              fetchMembers();
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

  {/*Updates fetchMembers to use the correct path*/}
  const fetchMembers = async () => {
    try {
      if (!userGroupId) return;
      
      const snapshot = await getDocs(collection(db, 'groups', userGroupId, 'users'));
      const members = snapshot.docs.map(doc => {
        const data = doc.data();
        return data.FirstName || data.firstName || null;
      }).filter(Boolean);
      
      const uniqueFirstNames = [...new Set(members)]; 
      setAllMembers(uniqueFirstNames);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  {/*Makes sure all relevant group info is displayed*/}
  const fetchActivities = async () => {
    try {
      setLoading(true);
      
      if (!userGroupId) {
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, 'groups', userGroupId, 'transactions'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const oneWeekAgo = new Date(today);
      oneWeekAgo.setDate(today.getDate() - 7);

      const oneMonthAgo = new Date(today);
      oneMonthAgo.setMonth(today.getMonth() - 1);

      const oneYearAgo = new Date(today);
      oneYearAgo.setFullYear(today.getFullYear() - 1);

      const filteredActivities = querySnapshot.docs
        .map(doc => {
          const data = doc.data();
          let activityDate = data.activityDate;
          
          if (activityDate?.seconds) {
            activityDate = new Date(activityDate.seconds * 1000);
          } else if (typeof activityDate === 'string') {
            activityDate = new Date(activityDate);
          }

          if (!(activityDate instanceof Date) || isNaN(activityDate.getTime())) {
            activityDate = null;
          }

          return {
            id: doc.id,
            ...data,
            activityDate,
            membersChecked: data.membersChecked || [],
            memberName: data.memberName || null,
            member: data.member || null,
            attendees: data.attendees || null
          };
        })
        .filter(activity => {
          if (!activity.activityDate) return false;

          let dateMatch = true;
          if (filterOption === 'week') {
            dateMatch = activity.activityDate >= oneWeekAgo;
          } else if (filterOption === 'month') {
            dateMatch = activity.activityDate >= oneMonthAgo;
          } else if (filterOption === 'year') {
            dateMatch = activity.activityDate >= oneYearAgo;
          }

          let eventMatch = true;
          if (filterEvent !== 'all') {
            const activityName = activity.activityName?.toLowerCase() || '';
            eventMatch = activityName.includes(filterEvent.toLowerCase());
          }

          if (!showAllActivities && filterMember && filterMember !== 'all') {
            if (Array.isArray(activity.membersChecked)) {
              return dateMatch && eventMatch && activity.membersChecked.includes(filterMember);
            }
            return dateMatch && eventMatch && (
              activity.memberName === filterMember ||
              activity.name === filterMember ||
              activity.member === filterMember
            );
          }

          return dateMatch && eventMatch;
        });

      setActivities(filteredActivities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      setErrorMessage("Failed to fetch activities.");
    } finally {
      setLoading(false);
    }
  };

  {/*Update the dependency array to include userGroupId*/}
  useEffect(() => {
    fetchActivities();
    fetchMembers();
  }, [filterOption, filterMember, showAllActivities, filterEvent, userGroupId]);


  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleEventFilterChange = (event) => {
    setFilterEvent(event.target.value);
  };

  const handleMemberNameChange = (event) => {
    setMemberName(event.target.value);
  };

  const handleFilterChange = (event) => {
    setFilterOption(event.target.value);
  };

  {/*Handles the Logout for the admin*/}
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  {/*Handles Submission*/}
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedDate || !memberName) {
      setErrorMessage('Please select a date and enter a member name');
      return;
    }

    try {
      const localDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
      );

      const attendanceData = { 
        activityDate: Timestamp.fromDate(localDate),
        member: memberName 
      };
      
      await addDoc(collection(db, 'attendance'), attendanceData);
      const q = query(collection(db, 'attendance'), orderBy('activityDate', 'desc'));
      const querySnapshot = await getDocs(q);
      const updatedActivities = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setActivities(updatedActivities);

      setSelectedDate(null);
      setMemberName('');
      setErrorMessage('');
    } catch (error) {
      console.error('Error submitting data:', error);
      setErrorMessage('Failed to submit data. Please try again.');
    }
  };

  {/*Toggles between user's activities and all activities*/}
  const toggleAllActivities = () => {
    setShowAllActivities((prev) => {
      const next = !prev;
      if (next) {
        setFilterMember("all");
      } else {
        setFilterMember(firstName);
      }
      return next;
    });
  };

  {/*Main Component UI*/}
  return (
    <div
      className="home-container"
      style={{
        minHeight: '100vh',
        background: '#f5f3ff',
        padding: '0',
        margin: '0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        overflow: 'hidden'
      }}
    >
      {/* Logo and Title */}
      <img
        src={logo}
        alt="Logo"
        style={{
          display: 'block',
          margin: '60px auto 0 auto',
          maxWidth: '250px',
          height: 'auto',
          marginBottom: '10px',
          marginTop: '-10px'
        }}
      />
      <h1
        style={{
          marginTop: '-20px',
          marginBottom: '30px',
          color: 'black',
          fontWeight: 700,
          fontSize: '1.4em',
          letterSpacing: '1px',
          textShadow: '0 2px 8px rgba(0,0,0,0.08)',
          marginLeft: '-20px'
        }}
      >
        Game History
      </h1>
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
        {/* Welcome message and logout link */}
        <span
          className="user-name"
          style={{
            alignSelf: 'flex-end',
            marginRight: '-15px',
            marginTop: '-30px',
            fontSize: '0.9em',
            color: '#333',
            fontWeight: 600,
            letterSpacing: '0.5px'
          }}
        >
          Welcome, {firstName ? firstName : 'User'}!
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
            marginRight: '-15px',
            alignSelf: 'flex-end'
          }}
        >
          Logout
        </span>
      </div>
      {/* Main component which holds filters and tables */}
      <div
        className="member-list-container"
        style={{
          marginTop: '-100px',
          maxWidth: '950px',
          width: '112%',
          marginLeft: '-57px',
          marginRight: 'auto',
          background: 'white',
          borderRadius: '16px',
          padding: '22px 32px 24px 32px',
          minHeight: '550px',
          overflow: 'visible',
          fontSize: '1.1em',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
          position: 'relative',
          transform: 'scale(0.73)'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            margin: '10px 0 30px 0',
            gap: '20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: 600, fontSize: '1.0em', color: '#333' }}>Members:</span>
              <select
                onChange={(e) => setFilterMember(e.target.value)}
                value={filterMember}
                style={{
                  fontSize: '0.95em',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '2px solid #ccc',
                  background: '#f7faff'
                }}
                disabled={showAllActivities}
              >
                <option value="all">All</option>
                {allMembers.map((name, idx) => (
                  <option key={idx} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: 600, fontSize: '1.0em', color: '#333' }}>Dates:</span>
              <select
                onChange={handleFilterChange}
                value={filterOption}
                style={{
                  fontSize: '0.95em',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #ccc',
                  background: '#f7faff'
                }}
              >
                <option value="all">All</option>
                <option value="week">Past Week</option>
                <option value="month">Past Month</option>
                <option value="year">Past Year</option>
              </select>
            </div>
          </div>
          {/* Event Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 600, fontSize: '1.0em', color: '#333' }}>Event:</span>
            <select
              onChange={handleEventFilterChange}
              value={filterEvent}
              style={{
                fontSize: '0.95em',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #ccc',
                background: '#f7faff'
              }}
            >
              <option value="all">All</option>
              <option value="volleyball">Volleyball</option>
              <option value="pickleball">PickleBall</option>
              <option value="cricket">Cricket</option>
            </select>
          </div>
        </div>
        {/* Table displaying activity history */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          maxHeight: '400px',
          marginBottom: '81px'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            background: 'white',
            fontSize: '0.80em',
            borderRadius: '10px',
            overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            marginBottom: '20px',
            tableLayout: 'fixed'
          }}>
            <thead>
              <tr>
                <th style={{ padding: '10px', background: '#007bff', color: 'white', borderRadius: '4px 4px 0 0', fontSize: '0.9em', fontWeight: 600 }}>Activity Name</th>
                <th style={{ padding: '10px', background: '#007bff', color: 'white', fontSize: '0.9em', fontWeight: 600 }}>Date</th>
                <th style={{ padding: '10px', background: '#007bff', color: 'white', fontSize: '0.9em', fontWeight: 600 }}>Expense Per Head</th>
                <th style={{ padding: '10px', background: '#007bff', color: 'white', fontSize: '0.9em', fontWeight: 600 }}>Total Amount</th>
                <th style={{ padding: '10px', background: '#007bff', color: 'white', fontSize: '0.9em', fontWeight: 600 }}>Attendees</th>
              </tr>
            </thead>
            <tbody>
              {activities.length > 0 ? (
                activities.map((activity, idx) => (
                  <tr
                    key={activity.id}
                    style={{
                      borderBottom: '1px solid #eee',
                      background: idx % 2 === 0 ? '#f9f9f9' : '#fff'
                    }}
                  >
                    <td style={{ padding: '10px', textAlign: 'center' }}>{activity.activityName || 'N/A'}</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      {formatActivityDate(activity.activityDate)}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>${activity.expensePerHead ?? 'N/A'}</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>${activity.totalExpense ?? 'N/A'}</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                    {activity.membersChecked && Array.isArray(activity.membersChecked) 
                      ? activity.membersChecked.join(', ')
                      : activity.memberName || activity.member || 'N/A'}
                  </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '18px', fontSize: '1.1em', color: '#888' }}>No activities found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Divider line below table */}
        <hr style={{ margin: '0px 0 0 0', border: 'none', borderTop: '2px solid #eee', width: '100%', marginTop: '-120px' }} />
        <div style={{
          display: 'flex',
          gap: '20px',
          justifyContent: 'center',
          marginTop: '0px',
          position: 'sticky',
          bottom: 0,
          background: 'white',
          padding: '20px 0 0 0',
          zIndex: 2
        }}>
          {/* Navigation to Home*/}
          <button
            type="button"
            className="bottom-button"
            style={{
              padding: '12px 36px',
              fontSize: '0.8em',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              marginTop: '0px',
              marginBottom: '-15px'
            }}
            onClick={() => navigate('/Home')}
          >
            Home
          </button>
        </div>
      {/*Error Message*/}
      </div>
      {errorMessage && (
        <p className="error-message" style={{ color: 'red', textAlign: 'center', marginTop: '18px', fontSize: '1.1em' }}>
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default GameHistory;