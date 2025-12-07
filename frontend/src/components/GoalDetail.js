import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import './GoalDetail.css';
import { getGoalById, updateTaskStatus } from '../services/api';

const GoalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingTasks, setUpdatingTasks] = useState(new Set());

  const fetchGoal = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getGoalById(id);
      setGoal(data);
      setError(null);
    } catch (err) {
      setError('Failed to load goal. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchGoal();
  }, [fetchGoal]);

  const handleStatusChange = async (taskId, newStatus) => {
    setUpdatingTasks(prev => new Set(prev).add(taskId));
    try {
      await updateTaskStatus(taskId, newStatus);
      setGoal(prev => ({
        ...prev,
        tasks: prev.tasks.map(task =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      }));
    } catch (err) {
      setError('Failed to update task status. Please try again.');
      console.error(err);
    } finally {
      setUpdatingTasks(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  };

  if (loading) {
    return <div className="loading">Loading goal details...</div>;
  }

  if (error && !goal) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate('/')} className="back-btn">
          ← Back to Home
        </button>
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="error-container">
        <div className="error-message">Goal not found</div>
        <button onClick={() => navigate('/')} className="back-btn">
          ← Back to Home
        </button>
      </div>
    );
  }

  const completedCount = goal.tasks.filter(t => t.status === 'completed').length;
  const progress = goal.tasks.length > 0 
    ? Math.round((completedCount / goal.tasks.length) * 100) 
    : 0;

  return (
    <div className="goal-detail">
      <button onClick={() => navigate('/')} className="back-btn">
        ← Back to Home
      </button>

      <div className="goal-header">
        <h1>{goal.goal_text}</h1>
        <div className="goal-meta">
          <span>Created: {format(new Date(goal.created_at), 'MMM dd, yyyy')}</span>
        </div>
      </div>

      {goal.reasoning && (
        <div className="reasoning-box">
          <h3>AI Reasoning</h3>
          <p>{goal.reasoning}</p>
        </div>
      )}

      <div className="progress-section">
        <div className="progress-header">
          <h2>Progress</h2>
          <span className="progress-text">{progress}% Complete</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="progress-stats">
          <span>{completedCount} of {goal.tasks.length} tasks completed</span>
        </div>
      </div>

      <div className="tasks-section">
        <h2>Tasks ({goal.tasks.length})</h2>
        {goal.tasks.length === 0 ? (
          <div className="empty-tasks">No tasks generated yet.</div>
        ) : (
          <div className="tasks-list">
            {goal.tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onStatusChange={handleStatusChange}
                isUpdating={updatingTasks.has(task.id)}
                allTasks={goal.tasks}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const TaskCard = ({ task, index, onStatusChange, isUpdating, allTasks }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#4caf50';
      case 'in_progress': return '#2196f3';
      default: return '#ff9800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      default: return '#4caf50';
    }
  };

  const canStart = () => {
    if (!task.dependencies || task.dependencies.length === 0) {
      return true;
    }
    return task.dependencies.every(depTitle => {
      const depTask = allTasks.find(t => t.title === depTitle);
      return depTask && depTask.status === 'completed';
    });
  };

  const dependencyTasks = task.dependencies
    ? task.dependencies.map(depTitle => allTasks.find(t => t.title === depTitle)).filter(Boolean)
    : [];

  return (
    <div className={`task-card ${!canStart() ? 'blocked' : ''}`}>
      <div className="task-header">
        <div className="task-number">#{index + 1}</div>
        <div className="task-title-section">
          <h3>{task.title}</h3>
          <div className="task-badges">
            <span 
              className="priority-badge"
              style={{ backgroundColor: getPriorityColor(task.priority) }}
            >
              {task.priority}
            </span>
            <span 
              className="status-badge"
              style={{ backgroundColor: getStatusColor(task.status) }}
            >
              {task.status.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {task.description && (
        <p className="task-description">{task.description}</p>
      )}

      <div className="task-details">
        {task.start_date && task.end_date && (
          <div className="task-dates">
            <span>📅 {format(new Date(task.start_date), 'MMM dd')} - {format(new Date(task.end_date), 'MMM dd, yyyy')}</span>
            <span className="task-duration">({task.estimated_days} days)</span>
          </div>
        )}

        {dependencyTasks.length > 0 && (
          <div className="task-dependencies">
            <strong>Depends on:</strong>
            <div className="dependencies-list">
              {dependencyTasks.map(dep => (
                <span 
                  key={dep.id} 
                  className={`dependency-tag ${dep.status === 'completed' ? 'completed' : 'pending'}`}
                >
                  {dep.title}
                </span>
              ))}
            </div>
          </div>
        )}

        {!canStart() && (
          <div className="blocked-notice">
            ⚠️ This task is blocked until dependencies are completed
          </div>
        )}
      </div>

      <div className="task-actions">
        <select
          value={task.status}
          onChange={(e) => onStatusChange(task.id, e.target.value)}
          disabled={isUpdating || !canStart()}
          className="status-select"
        >
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>
    </div>
  );
};

export default GoalDetail;

