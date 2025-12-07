import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import GoalForm from './GoalForm';
import GoalList from './GoalList';
import { getAllGoals, deleteGoal } from '../services/api';

const Home = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const data = await getAllGoals();
      setGoals(data);
      setError(null);
    } catch (err) {
      setError('Failed to load goals. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoalCreated = (newGoal) => {
    navigate(`/goals/${newGoal.id}`);
  };

  const handleDeleteGoal = async (id) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        await deleteGoal(id);
        setGoals(goals.filter(goal => goal.id !== id));
      } catch (err) {
        setError('Failed to delete goal. Please try again.');
        console.error(err);
      }
    }
  };

  return (
    <div className="home">
      <GoalForm onGoalCreated={handleGoalCreated} />
      
      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading">Loading goals...</div>
      ) : (
        <GoalList 
          goals={goals} 
          onDelete={handleDeleteGoal}
        />
      )}
    </div>
  );
};

export default Home;

