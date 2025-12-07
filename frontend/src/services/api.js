import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const createGoal = async (goalText) => {
  const response = await api.post('/goals', { goal_text: goalText });
  return response.data;
};

export const getAllGoals = async () => {
  const response = await api.get('/goals');
  return response.data;
};

export const getGoalById = async (id) => {
  const response = await api.get(`/goals/${id}`);
  return response.data;
};

export const updateTaskStatus = async (taskId, status) => {
  const response = await api.patch(`/goals/tasks/${taskId}`, { status });
  return response.data;
};

export const deleteGoal = async (id) => {
  const response = await api.delete(`/goals/${id}`);
  return response.data;
};

export default api;

