import React, { useState } from 'react';
import './GoalForm.css';
import { createGoal } from '../services/api';

const GoalForm = ({ onGoalCreated }) => {
  const [goalText, setGoalText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!goalText.trim()) {
      setError('Please enter a goal');
      return;
    }

    if (goalText.trim().length < 10) {
      setError('Goal must be at least 10 characters long');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const newGoal = await createGoal(goalText.trim());
      setGoalText('');
      onGoalCreated(newGoal);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          'Failed to create goal. Please try again.';
      setError(errorMessage);
      console.error('Error creating goal:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="goal-form-container">
      <form className="goal-form" onSubmit={handleSubmit}>
        <h2>Create New Goal</h2>
        <div className="form-group">
          <label htmlFor="goal">Enter your goal:</label>
          <textarea
            id="goal"
            value={goalText}
            onChange={(e) => setGoalText(e.target.value)}
            placeholder="e.g., Launch a product in 2 weeks"
            rows="4"
            disabled={loading}
          />
          <small>Describe your goal in detail (minimum 10 characters)</small>
        </div>
        {error && <div className="form-error">{error}</div>}
        <button 
          type="submit" 
          className="submit-btn"
          disabled={loading || !goalText.trim()}
        >
          {loading ? 'Generating Plan...' : 'Generate Task Plan'}
        </button>
      </form>
    </div>
  );
};

export default GoalForm;

