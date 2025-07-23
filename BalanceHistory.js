import React, { useState, useEffect } from 'react';
import './App.css';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from './Firebase';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import logo from './images/logo1.png';
/**
 * Balance History Component which shows the admin all the transactions made by the group
 * @component
 * @returns {JSX.Element} - Balance History Component
 */
const BalanceHistory = () => {
  // React Router's navigation hook
  const navigate = useNavigate();
  // States for the filters
  const [filterOption, setFilterOption] = useState('all');
  const [filterEvent, setFilterEvent] = useState('all');
  const [allMembers, setAllMembers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [memberName, setMemberName] = useState('');
  // Error Message State
  const [errorMessage, setErrorMessage] = useState('');
  // State for logged-in members's first name
  const [firstName, setFirstName] = useState('');
  // State for loading submission 
  const [loading, setLoading] = useState(true);
  // State for the logged-in member's groupID
  const [userGroupId, setUserGroupId] = useState(null);

  {/*Fetch user data and group ID*/}
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setFirstName(userData.firstName || userData.FirstName || 'User');
            
            if (userData.groupId) {
              setUserGroupId(userData.groupId);
              return;
            }
          }

          const groupsSnapshot = await getDocs(collection(db, 'groups'));
          for (const groupDoc of groupsSnapshot.docs) {
            const userRef = doc(db, 'groups', groupDoc.id, 'users', user.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
              const userData = userSnap.data();
              setFirstName(userData.firstName || userData.FirstName || 'User');
              setUserGroupId(groupDoc.id);
              break;
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setLoading(false);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  {/*Fetch all unique member names*/}
  useEffect(() => {
    if (!userGroupId) return;

    const fetchMembers = async () => {
      try {
        const usersRef = collection(db, 'groups', userGroupId, 'users');
        const usersSnapshot = await getDocs(usersRef);
        
        const members = [];
        const memberNames = new Set();
        
        usersSnapshot.docs.forEach(doc => {
          const userData = doc.data();
          const name = userData.firstName || 
                      userData.FirstName || 
                      userData.firstname || 
                      userData.first_name || 
                      userData.name || 
                      `Member ${doc.id.substring(0, 4)}`;
          
          if (name && !memberNames.has(name)) {
            memberNames.add(name);
            members.push({
              id: doc.id,
              name: name
            });
          }
        });
        members.sort((a, b) => a.name.localeCompare(b.name));
        
        setAllMembers(members);
      } catch (error) {
        console.error('Error fetching members:', error);
      }
    };

    fetchMembers();
  }, [userGroupId]);

  {/*Fetch transactions*/}
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!userGroupId) return;

      try {
        setLoading(true);
        
        const balancesQuery = query(
          collection(db, 'groups', userGroupId, 'balances'),
          orderBy('date', 'desc')
        );
        const balancesSnapshot = await getDocs(balancesQuery);
        
          const transactions = balancesSnapshot.docs.map(doc => {
          const data = doc.data();
          const memberName = data.memberName || data.member || data.name || data.FirstName || data.firstName;
          
          return {
            id: doc.id,
            ...data,
            memberName: memberName || `Member ${data.userId?.substring(0, 4)}`,
            amount: data.transactionAmount,
            type: data.transactionType
          };
        });

        // Apply filters
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const filteredTransactions = transactions.filter(transaction => {
          // Date filter
          if (filterOption !== 'all') {
            if (!transaction.date) return false;
            
            const transactionDate = transaction.date.toDate();
            transactionDate.setHours(0, 0, 0, 0);

            const oneWeekAgo = new Date(today);
            oneWeekAgo.setDate(today.getDate() - 7);

            const oneMonthAgo = new Date(today);
            oneMonthAgo.setMonth(today.getMonth() - 1);

            const oneYearAgo = new Date(today);
            oneYearAgo.setFullYear(today.getFullYear() - 1);

            switch (filterOption) {
              case 'week':
                if (transactionDate < oneWeekAgo) return false;
                break;
              case 'month':
                if (transactionDate < oneMonthAgo) return false;
                break;
              case 'year':
                if (transactionDate < oneYearAgo) return false;
                break;
              default:
                break;
            }
          }

          // Event filter
          if (filterEvent !== 'all') {
            const transactionEvent = transaction.event?.toLowerCase();
            if (!transactionEvent || !transactionEvent.includes(filterEvent.toLowerCase())) {
              return false;
            }
          }

          // Member filter
          if (memberName && memberName !== '') {
            const transactionMember = (transaction.memberName || '').toLowerCase();
            return transactionMember === memberName.toLowerCase();
          }

          return true;
        });

        setActivities(filteredTransactions);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setErrorMessage('Failed to fetch transaction history.');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [userGroupId, filterOption, memberName, filterEvent]);

  {/*Format transaction date for display*/}
  const formatActivityDate = (date) => {
    if (!date) return 'N/A';
    try {
      if (date instanceof Date) {
        return date.toLocaleDateString();
      }
      if (date.toDate) {
        return date.toDate().toLocaleDateString();
      }
      return 'N/A';
    } catch (e) {
      return 'N/A';
    }
  };

  // Event handlers
  const handleEventFilterChange = (event) => {
    setFilterEvent(event.target.value);
  };

  const handleMemberNameChange = (event) => {
    setMemberName(event.target.value);
  };

  const handleFilterChange = (event) => {
    setFilterOption(event.target.value);
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

  {/*Main Component UI*/}
  return (
    <div className="home-container" style={{
      minHeight: '100vh',
      background: '#e3f2fd',
      padding: '0',
      margin: '0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      overflow: 'hidden'
    }}>
      {/* Logo and page title */}
      <img
        src={logo}
        alt="Logo"
        style={{
          display: 'block',
          margin: '60px auto 0 auto',
          maxWidth: '250px',
          height: 'auto',
          marginBottom: '10px',
          marginTop: '-10px',
        }}
      />
      <h1 style={{
        marginTop: '-10px',
        marginBottom: '20px',
        color: 'black',
        fontWeight: 700,
        fontSize: '1.4em',
        letterSpacing: '1px',
        textShadow: '0 2px 8px rgba(0,0,0,0.08)',
        marginLeft: '0px'
      }}>
        Balance History
      </h1>

      {/* Welcome and Logout UI */}
      <div style={{
        position: 'absolute',
        right: '30px',
        top: '40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        zIndex: 2
      }}>
        <span style={{
          alignSelf: 'flex-end',
          marginRight: '-15px',
          marginTop: '-30px',
          fontSize: '0.9em',
          color: '#333',
          fontWeight: 600,
          letterSpacing: '0.5px'
        }}>
          Welcome, {firstName ? firstName : 'User'}!
        </span>
        <span
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

      {/* Main component -> filters and tables */}  
      <div style={{
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
        transform: 'scale(0.70)'
      }}>
        {/* Filters */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          margin: '10px 0 30px 0',
          gap: '20px'
        }}>
          {/* Row: Members and Dates */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '10px' }}>
            {/* Members Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: 600, fontSize: '1.0em', color: '#333' }}>Members:</span>
              <select
                onChange={handleMemberNameChange}
                value={memberName}
                style={{
                  fontSize: '0.95em',
                  padding: '7px 12px',
                  borderRadius: '6px',
                  border: '1px solid #ccc',
                  background: '#f7faff',
                  width: '90%'
                }}
              >
                <option value="">All Members</option>
                {allMembers.map((member) => (
                  <option key={member.id} value={member.name}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
            {/* Dates Filter */}
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

        {/* Main Table */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          maxHeight: '500px',
          marginBottom: '80px',
          position: 'relative',
          width: "100%",
          minHeight: '200px'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            background: 'white',
            fontSize: '0.95em',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            marginBottom: '20px',
            tableLayout: 'fixed'
          }}>
            <thead>
              <tr>
                <th style={{ padding: '12px', background: '#007bff', color: 'white', borderRadius: '4px 4px 0 0', fontSize: '0.95em', fontWeight: 600 }}>Name</th>
                <th style={{ padding: '12px', background: '#007bff', color: 'white', fontSize: '0.95em', fontWeight: 600 }}>Date</th>
                <th style={{ padding: '12px', background: '#007bff', color: 'white', fontSize: '0.95em', fontWeight: 600 }}>Event</th>
                <th style={{ padding: '12px', background: '#007bff', color: 'white', fontSize: '0.95em', fontWeight: 600 }}>Amount</th>
                <th style={{ padding: '12px', background: '#007bff', color: 'white', fontSize: '0.95em', fontWeight: 600 }}>Type</th>
              </tr>
            </thead>
            <tbody>
              {activities.length > 0 ? (
                activities.map((activity, idx) => (
                  <tr
                    key={`${activity.id}-${idx}`}
                    style={{
                      borderBottom: '1px solid #eee',
                      background: idx % 2 === 0 ? '#f9f9f9' : '#fff'
                    }}
                  >
                    <td style={{ padding: '12px', textAlign: 'center', color: 'black', fontWeight: 500 }}>
                      {activity.memberName}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', color: 'black', fontWeight: 500 }}>{formatActivityDate(activity.date)}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: 'black', fontWeight: 500 }}>{activity.event || 'N/A'}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: 'black', fontWeight: 500 }}>
                      {activity.amount !== undefined ? `$${Math.abs(activity.amount).toFixed(2)}` : 'N/A'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', color: 'black', fontWeight: 500 }}>
                      {activity.type ? activity.type.charAt(0).toUpperCase() + activity.type.slice(1).toLowerCase() : 'N/A'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '20px', fontSize: '1.1em', color: '#555', fontWeight: 500 }}>
                    {loading ? 'Loading transactions...' : 'No transactions found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Divider between table and buttons */}
        <hr style={{ margin: '0px 0 0 0', border: 'none', borderTop: '2px solid #eee', width: '100%', marginTop: '-120px' }} />

        {/* Navigation buttons */}
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
      </div>
      {/*Error Message*/}
      {errorMessage && (
        <p className="error-message" style={{ color: 'red', textAlign: 'center', marginTop: '18px', fontSize: '1.1em' }}>
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default BalanceHistory;