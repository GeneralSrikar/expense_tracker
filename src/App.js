import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import Attendance from './Attendance';
import GameHistory from './GameHistory';
import BalanceUpdate from './BalanceUpdate';
import BalanceHistory from './BalanceHistory';
import Members from './Members';
import Login from './Login';
import Signup from './Signup';
import ForgotPassword from './Forgot';
import CalendarPage from './CalendarPage';
import Add from './Add';
import Update from './Update';
import Delete from './Delete';
import Admin from './Admin';
import UserMembers from './UserMembers';
import UserBalanceHistory from './UserBalanceHistory';
import UserGameHistory from './UserGameHistory';
import Adminsignup from './Adminsignup';
import UserHome from './UserHome';
import Remove_Activity from './Remove_Activity';
import UserYourBalance from './UserYourBalance';
import YourBalanceAdmin from './YourBalanceAdmin';
import Signup2 from './Signup2';
import InitialAdminSignup from './Initial-Admin-SignUp';
import UserSignup from './UserSignup';
import AdminSignup from './Admin-Signup';
import AdminSetup from './Admin_Setup';
import InitialSetup from './Initial_Setup';
import { auth } from './Firebase';

const App = () => {
  const firstName = 'John';

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/game-history" element={<GameHistory firstName={firstName} auth={auth} />} />
        <Route path="/balance-update" element={<BalanceUpdate firstName={firstName} auth={auth} />} />
        <Route path="/balance-history" element={<BalanceHistory firstName={firstName} auth={auth} />} />
        <Route path="/members" element={<Members firstName={firstName} auth={auth} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/add" element={<Add />} />
        <Route path="/update" element={<Update />} />
        <Route path="/delete" element={<Delete />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/user-members" element={<UserMembers />} />
        <Route path="/user-balance-history" element={<UserBalanceHistory />} />
        <Route path="/user-game-history" element={<UserGameHistory />} />
        <Route path="/adminsignup" element={<Adminsignup />} />
        <Route path="/UserHome" element={<UserHome />} />
        <Route path="/remove-activity" element={<Remove_Activity />} />
        <Route path="/your-balance" element={<UserYourBalance />} />
        <Route path="/admin/balance" element={<YourBalanceAdmin />} />
        <Route path="/signup2" element={<Signup2 />} />
        <Route path="/initial-admin-signup" element={<InitialAdminSignup />} />
        <Route path="/user-signup" element={<UserSignup />} />
        <Route path="/admin-signup" element={<AdminSignup />} />
        <Route path="/admin-setup" element={<AdminSetup />} />
        <Route path="/initial-setup" element={<InitialSetup />} />
      </Routes>
    </Router>
  );
};

export default App;