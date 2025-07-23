// filepath: /C:/Users/srika/my-expense-app/src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Signup from './SignUp';
import Login from './Login';

function App() {
  return (
    <Router>
      <div className="App">
        <Switch>
          <Route path="/signup" component={Signup} />
          <Route path="/login" component={Login} />
          <Route path="/" component={Login} />
        </Switch>
      </div>
    </Router>
  );
}

export default App;