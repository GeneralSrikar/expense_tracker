import React, { useState, useEffect } from 'react';
import './App.css';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth'; // Ensure you have this import if using Firebase
import { auth, db } from './Firebase';
import { collection, addDoc } from 'firebase/firestore';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const CalendarPage = ({ firstName = 'User' }) => {
  const [data, setData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null); // Set initial state to null
  const [memberName, setMemberName] = useState(''); // State for member name
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch initial data or perform any setup when the component mounts
    const fetchData = async () => {
      try {
        // Replace with your data fetching logic
        const fetchedData = []; // Example: await fetchDataFromAPI();
        setData(fetchedData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setErrorMessage('Failed to fetch data. Please try again.');
      }
    };

    fetchData();
  }, []);

  const handleDateChange = (date) => {
    console.log('Selected Date:', date); // Debugging log
    setSelectedDate(date);
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

      setData([...data, attendanceData]);
      setSelectedDate(null); // Reset the date picker after submission
      setMemberName(''); // Reset the member name input after submission
      setErrorMessage('');
    } catch (error) {
      console.error('Error submitting data:', error);
      setErrorMessage('Failed to submit data. Please try again.');
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
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
            selected={selectedDate} // Initially null to show placeholder
            onChange={handleDateChange}
            dateFormat="MMMM d, yyyy"
            className="date-picker"
            placeholderText="Select a date" // Placeholder text
            isClearable // Allow the date to be cleared
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
      </div>
    </div>
  );
};

export default CalendarPage;