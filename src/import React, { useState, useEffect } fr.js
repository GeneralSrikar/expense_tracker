import React, { useState, useEffect } from 'react';
import './App.css';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from './Firebase';
import {
  addDoc,
  collection,
  getDocs,
  query,
  orderBy,
  where,
  Timestamp,
  getDoc,
  doc,
} from 'firebase/firestore';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import logo from './images/logo1.png';

const GameHistory = () => {
  const [activities, setActivities] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [memberName, setMemberName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [firstName, setFirstName] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [filterOption, setFilterOption] = useState('all');
  const [memberList, setMembersList] = useState([]);
  const [balances, setBalances] = useState({});

  // Format activity date consistently
  const formatActivityDate = (activityDate) => {
    if (!activityDate) return 'N/A';
    try {
      // If activityDate is a Date object
      if (activityDate instanceof Date && !isNaN(activityDate)) {
        return activityDate.toLocaleDateString();
      }
      // If activityDate is a Firestore Timestamp object
      if (activityDate.seconds) {
        return new Date(activityDate.seconds * 1000).toLocaleDateString();
      }
      // If activityDate is a string (e.g., 'YYYY-MM-DD')
      if (typeof activityDate === 'string') {
        const d = new Date(activityDate);
        if (!isNaN(d)) return d.toLocaleDateString();
      }
      return 'N/A';
    } catch (e) {
      return 'N/A';
    }
  };

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const membersSnapshot = await getDocs(collection(db, 'members'));
        // Only use firstName for dropdown options
        const members = membersSnapshot.docs.map((doc) => {
          const data = doc.data();
          return data.firstName || data.name || data.lastName || doc.id;
        });
        setMembersList([...new Set(members.filter(Boolean))]);
      } catch (error) {
        console.error('Error fetching members:', error);
      }
    };

    // Fetch balances for all members
    const fetchBalances = async () => {
      try {
        const balancesSnapshot = await getDocs(collection(db, 'balances'));
        const balancesMap = {};
        balancesSnapshot.docs.forEach(doc => {
          const data = doc.data();
          // Use firstName as key if available, else fallback to name/lastName
          const key = data.name || data.firstName || data.lastName || doc.id;
          balancesMap[key] = data.balance;
        });
        setBalances(balancesMap);
      } catch (error) {
        console.error('Error fetching balances:', error);
      }
    };

    fetchMembers();
    fetchBalances();
  }, []);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, 'activities'), orderBy('activityDate', 'desc'));
        const querySnapshot = await getDocs(q);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const filteredActivities = querySnapshot.docs
          .map(doc => {
            const data = doc.data();
            let activityDate = data.activityDate?.seconds
              ? new Date(data.activityDate.seconds * 1000)
              : new Date(data.activityDate);

            if (isNaN(activityDate.getTime())) {
              activityDate = null;
            } else {
              activityDate.setHours(0, 0, 0, 0);
            }

            return {
              id: doc.id,
              ...data,
              activityDate
            };
          })
          .filter(activity => {
            if (filterOption === 'all') return true;
            if (!activity.activityDate) return false;

            const timeDiff = today - activity.activityDate;
            const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

            switch (filterOption) {
              case 'week':
                return daysDiff >= 0 && daysDiff <= 6;
              case 'month':
                return daysDiff >= 0 && daysDiff <= 29;
              case 'year':
                return daysDiff >= 0 && daysDiff <= 364;
              default:
                return true;
            }
          });

        const finalActivities = !memberName
          ? filteredActivities
          : filteredActivities.filter(activity => {
              if (Array.isArray(activity.membersChecked)) {
                return activity.membersChecked.includes(memberName);
              }
              return (
                activity.memberName === memberName ||
                activity.name === memberName ||
                activity.member === memberName
              );
            });

        setActivities(finalActivities);
      } catch (error) {
        console.error('Error fetching activities:', error);
        setErrorMessage('Failed to fetch activities.');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [filterOption, memberName]); // ✅ Fixed here


  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setFirstName(userData.FirstName);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchUserData();
  }, []);

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleMemberNameChange = (event) => {
    setMemberName(event.target.value);
  };

  const handleFilterChange = (event) => {
    setFilterOption(event.target.value);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedDate || !memberName) {
      setErrorMessage('Please select a date and enter a member name');
      return;
    }

    try {
      const attendanceData = {
        date: selectedDate.toISOString().split('T')[0],
        member: memberName,
      };
      await addDoc(collection(db, 'attendance'), attendanceData);
      await addDoc(collection(db, 'members'), { name: memberName });

      const q = query(collection(db, 'activities'), orderBy('activityDate', 'desc'));
      const querySnapshot = await getDocs(q);
      const updatedActivities = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
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

  const headerStyle = {
    padding: '6px',
    background: '#007bff',
    color: 'white',
    fontSize: '0.8em',
  };

  const cellStyle = {
    padding: '6px',
  };

  return (
    <div className="attendance-container" style={{ backgroundColor: '#f0f7fa', paddingTop: '0' }}>
      <img
        src={logo}
        alt="Logo"
        style={{
          display: 'block',
          margin: '60px auto 0 auto',
          maxWidth: '320px',
          height: 'auto',
          marginBottom: '-30px',
          marginTop: '-30px'
        }}
      />
      <h1
        style={{
          marginTop: '0px',
          marginBottom: '20px',
          color: 'black',
          fontWeight: 700,
          fontSize: '2.25em',
          letterSpacing: '1px',
          textShadow: '0 2px 8px rgba(0,0,0,0.08)',
          marginLeft:'-50px'
        }}
      >
        Balance History
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
        <span
          className="user-name"
          style={{
            alignSelf: 'flex-end',
            marginRight: '0px',
            marginTop: '-20px',
            fontSize: '1.15em',
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
            fontSize: '1.2em',
            background: 'none',
            border: 'none',
            padding: 0,
            marginTop: '2px',
            marginRight: '0px',
            alignSelf: 'flex-end'
          }}
        >
          Logout
        </span>
      </div>
      <div
        className="member-list-container"
        style={{
          marginTop: '10px',
          maxWidth: '950px',
          width: '100%',
          marginLeft: 'auto',
          marginRight: 'auto',
          background: 'white',
          borderRadius: '16px',
          padding: '32px 32px 24px 32px',
          minHeight: '525px',
          // Remove maxHeight so the container can grow
          overflow: 'visible',
          fontSize: '1em',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
          position: 'relative',
          marginBottom: '30px'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '10px 0 30px 0',
            gap: '60px',
            marginTop: '-10px'
          }}
        >
          {/* Member Filter (left) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 600, fontSize: '1.1em', color: '#333' }}>Member Name:</span>
            <select
              onChange={e => setMemberName(e.target.value)}
              value={memberName}
              style={{
                fontSize: '1em',
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #ccc',
                background: '#f7faff'
              }}
            >
              <option value="">All</option>
              {memberList
                .filter(Boolean)
                .map((name, idx) => (
                  <option key={idx} value={name}>{name}</option>
                ))}
            </select>
          </div>
          {/* Date Filter (right) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 600, fontSize: '1.1em', color: '#333' }}>Date Range:</span>
            <select
              onChange={handleFilterChange}
              value={filterOption}
              style={{
                fontSize: '1em',
                padding: '8px 16px',
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
        <div style={{
          flex: 1,
          overflowY: 'auto',
          maxHeight: '520px', // Show 8-10 rows before hitting the Home button
          marginBottom: '-50px'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>Loading activities...</div>
          ) : (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                background: 'white',
                fontSize: '1em',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                maxHeight: '500px'
              }}
            >
              <thead>
                <tr>
                  <th style={headerStyle}>Member Name</th>
                  <th style={headerStyle}>Date</th>
                  <th style={headerStyle}>Activity Name</th>
                  <th style={headerStyle}>Amount Change</th>
                  <th style={headerStyle}>Current Balance</th>
                </tr>
              </thead>
              <tbody>
                {activities.length > 0 ? (
                  activities.map((activity) => {
                    if (Array.isArray(activity.membersChecked) && activity.membersChecked.length > 0) {
                      // Only output the row for the filtered memberName if filter is active
                      if (memberName) {
                        if (
                          activity.membersChecked.includes(memberName) &&
                          memberList.includes(memberName)
                        ) {
                          return (
                            <tr key={activity.id + '-' + memberName} style={{ borderBottom: '1px solid #eee' }}>
                              <td style={cellStyle}>{memberName}</td>
                              <td style={cellStyle}>{formatActivityDate(activity.activityDate)}</td>
                              <td style={cellStyle}>
                                {activity.activityName || 'N/A'}
                              </td>
                              <td style={cellStyle}>
                                {activity.expensePerHead !== undefined ? `$${activity.expensePerHead.toFixed(2)}` : 'N/A'}
                              </td>
                              <td style={cellStyle}>
                                {/* Show current balance from balances map */}
                                {balances[memberName] !== undefined ? `$${balances[memberName].toFixed(2)}` : 'N/A'}
                              </td>
                            </tr>
                          );
                        } else {
                          return null;
                        }
                      } else {
                        // No filter, show only members currently in memberList
                        const uniqueMembers = [...new Set(activity.membersChecked)];
                        return uniqueMembers
                          .filter(member => memberList.includes(member))
                          .map((member, idx) => (
                            <tr key={activity.id + '-' + member + '-' + idx} style={{ borderBottom: '1px solid #eee' }}>
                              <td style={cellStyle}>{member}</td>
                              <td style={cellStyle}>{formatActivityDate(activity.activityDate)}</td>
                              <td style={cellStyle}>
                                {activity.activityName || 'N/A'}
                              </td>
                              <td style={cellStyle}>
                                {activity.expensePerHead !== undefined ? `$${activity.expensePerHead.toFixed(2)}` : 'N/A'}
                              </td>
                              <td style={cellStyle}>
                                {balances[member] !== undefined ? `$${balances[member].toFixed(2)}` : 'N/A'}
                              </td>
                            </tr>
                          ));
                      }
                    } else {
                      // Not an array, fallback to single member
                      if (memberName) {
                        if (
                          (activity.memberName === memberName ||
                            activity.name === memberName ||
                            activity.member === memberName) &&
                          memberList.includes(memberName)
                        ) {
                          return (
                            <tr key={activity.id} style={{ borderBottom: '1px solid #eee' }}>
                              <td style={cellStyle}>{memberName}</td>
                              <td style={cellStyle}>{formatActivityDate(activity.activityDate)}</td>
                              <td style={cellStyle}>
                                {activity.activityName || 'N/A'}
                              </td>
                              <td style={cellStyle}>
                                {activity.expensePerHead !== undefined ? `$${activity.expensePerHead.toFixed(2)}` : 'N/A'}
                              </td>
                              <td style={cellStyle}>
                                {balances[memberName] !== undefined ? `$${balances[memberName].toFixed(2)}` : 'N/A'}
                              </td>
                            </tr>
                          );
                        } else {
                          return null;
                        }
                      } else {
                        // Only show if the member is in memberList
                        const singleMember =
                          activity.memberName || activity.name || activity.member;
                        if (singleMember && memberList.includes(singleMember)) {
                          return (
                            <tr key={activity.id} style={{ borderBottom: '1px solid #eee' }}>
                              <td style={cellStyle}>{singleMember}</td>
                              <td style={cellStyle}>{formatActivityDate(activity.activityDate)}</td>
                              <td style={cellStyle}>
                                {activity.activityName || 'N/A'}
                              </td>
                              <td style={cellStyle}>
                                {activity.expensePerHead !== undefined ? `$${activity.expensePerHead.toFixed(2)}` : 'N/A'}
                              </td>
                              <td style={cellStyle}>
                                {balances[singleMember] !== undefined ? `$${balances[singleMember].toFixed(2)}` : 'N/A'}
                              </td>
                            </tr>
                          );
                        } else {
                          return null;
                        }
                      }
                    }
                  })
                ) : (
                  <tr>
                    <td colSpan="7" style={{ padding: '18px', textAlign: 'center', fontSize: '1.1em', color: '#888' }}>
                      No activities to display.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        <hr style={{ margin: '40px 0 0 0', border: 'none', borderTop: '2px solid #eee', width: '100%', marginTop: '90px'}} />
        <div style={{
          display: 'flex',
          gap: '20px',
          justifyContent: 'center',
          marginTop: '15px',
          position: 'sticky',
          bottom: 0,
          background: 'white',
          padding: '20px 0 0 0',
          zIndex: 2
        }}>
          <button
            type="button"
            className="bottom-button"
            style={{
              padding: '12px 36px',
              fontSize: '1.1em',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              marginBottom: '-10px',
              marginTop: '-20px'
            }}
            onClick={() => navigate('/Home')}
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameHistory;