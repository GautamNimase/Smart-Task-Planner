import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import GoalDetail from './components/GoalDetail';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="App">
        <header className="app-header">
          <h1>Smart Task Planner</h1>
          <p>Break your goals into actionable tasks with AI</p>
        </header>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/goals/:id" element={<GoalDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

