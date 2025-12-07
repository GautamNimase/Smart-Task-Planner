import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import './GoalList.css';

const GoalList = ({ goals, onDelete }) => {
  const navigate = useNavigate();

  if (goals.length === 0) {
    return (
      <div className="empty-state">
        <p>No goals yet. Create your first goal to get started!</p>
      </div>
    );
  }

  return (
    <div className="goal-list">
      <h2>Your Goals</h2>
      <div className="goals-grid">
        {goals.map(goal => (
          <div key={goal.id} className="goal-card">
            <div className="goal-card-header">
              <h3 
                className="goal-title"
                onClick={() => navigate(`/goals/${goal.id}`)}
              >
                {goal.goal_text.length > 60 
                  ? `${goal.goal_text.substring(0, 60)}...` 
                  : goal.goal_text}
              </h3>
              <button 
                className="delete-btn"
                onClick={() => onDelete(goal.id)}
                title="Delete goal"
              >
                ×
              </button>
            </div>
            <div className="goal-card-body">
              <div className="goal-stats">
                <span className="stat">
                  <strong>{goal.task_count || 0}</strong> tasks
                </span>
                <span className="stat">
                  <strong>{goal.completed_tasks || 0}</strong> completed
                </span>
              </div>
              <div className="goal-date">
                Created: {format(new Date(goal.created_at), 'MMM dd, yyyy')}
              </div>
            </div>
            <button 
              className="view-btn"
              onClick={() => navigate(`/goals/${goal.id}`)}
            >
              View Details →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GoalList;

