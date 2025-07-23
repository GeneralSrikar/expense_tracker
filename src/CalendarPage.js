import React, { useState, useEffect } from 'react';
import './App.css';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from './Firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [players, setPlayers] = useState([
    'Player 1',
    'Player 2',
    'Player 3',
    'Player 4',
    'Player 5',
  ]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [memberName, setMemberName] = useState('');
  const [members, setMembers] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch members from Firestore when the component mounts
    const fetchMembers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'members'));
        const membersList = querySnapshot.docs.map(doc => doc.data().name);
        setMembers(membersList);
      } catch (error) {
        console.error('Error fetching members:', error);
        setErrorMessage('Failed to fetch members. Please try again.');
      }
    };

    fetchMembers();
  }, []);

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleCheckboxChange = (event) => {
    const player = event.target.name;
    if (event.target.checked) {
      setSelectedPlayers([...selectedPlayers, player]);
    } else {
      setSelectedPlayers(selectedPlayers.filter((p) => p !== player));
    }
  };

  const handleMemberNameChange = (event) => {
    setMemberName(event.target.value);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      // Save attendance data to Firestore
      const attendanceData = { date: selectedDate, member: memberName };
      console.log(attendanceData); // For demonstration purposes
      await addDoc(collection(db, 'attendance'), attendanceData);

      // Save member name to Firestore
      const memberData = { name: memberName };
      await addDoc(collection(db, 'members'), memberData);

      setMembers([...members, memberName]); // Update the members state
      setSelectedDate(null); // Reset the date picker after submission
      setMemberName(''); // Reset the member name input after submission
      setErrorMessage('');
    } catch (error) {
      console.error('Error submitting data:', error);
      setErrorMessage('Failed to submit data. Please try again.');
    }
  };

  return (
    <div className='home-container'>
      <div className="header">
        <button className="logout-button" onClick={handleLogout}>Home</button>
      </div>
      <div className="attendance-container">
        <h1>Attendance</h1>
        <form onSubmit={handleSubmit}>
          <label htmlFor="calendar">Select Date:</label>
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            dateFormat="MMMM d, yyyy"
            className="date-picker"
            placeholderText="Select a date"
            isClearable
          />
          <label htmlFor="member">Add Member:</label>
          <input
            type="text"
            id="member"
            value={memberName}
            onChange={handleMemberNameChange}
            placeholder="Enter member name"
            required
          />
          <button type="submit" className="submit-button">Submit</button>
        </form>

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        <h2>Members List</h2>
        <ul className="members-list">
          {members.map((member, index) => (
            <li key={index} className="member-item">{member}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CalendarPage;