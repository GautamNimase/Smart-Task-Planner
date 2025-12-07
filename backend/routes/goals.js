const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const goalController = require('../controllers/goalController');

// Validation middleware
const validateGoal = [
  body('goal_text')
    .trim()
    .notEmpty()
    .withMessage('Goal text is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Goal text must be between 10 and 1000 characters')
];

// Create a new goal and generate task breakdown
router.post('/', validateGoal, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const result = await goalController.createGoal(req.body.goal_text);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating goal:', error);
    console.error('Error stack:', error.stack);
    
    // Provide more specific error messages
    let errorMessage = error.message || 'Failed to create goal';
    let statusCode = 500;
    
    if (error.message.includes('Database not connected')) {
      statusCode = 503; // Service Unavailable
      errorMessage = 'Database is not connected. Please ensure MySQL is running.';
    } else if (error.message.includes('OpenAI API key')) {
      statusCode = 503;
      errorMessage = 'AI service is not configured. Please set OPENAI_API_KEY in your .env file.';
    }
    
    res.status(statusCode).json({ 
      error: 'Failed to create goal', 
      message: errorMessage 
    });
  }
});

// Get all goals
router.get('/', async (req, res) => {
  try {
    const goals = await goalController.getAllGoals();
    res.json(goals);
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ 
      error: 'Failed to fetch goals', 
      message: error.message 
    });
  }
});

// Get a specific goal with its tasks
router.get('/:id', async (req, res) => {
  try {
    const goal = await goalController.getGoalById(req.params.id);
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.json(goal);
  } catch (error) {
    console.error('Error fetching goal:', error);
    res.status(500).json({ 
      error: 'Failed to fetch goal', 
      message: error.message 
    });
  }
});

// Update task status
router.patch('/tasks/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const task = await goalController.updateTaskStatus(req.params.id, status);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ 
      error: 'Failed to update task', 
      message: error.message 
    });
  }
});

// Delete a goal
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await goalController.deleteGoal(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ 
      error: 'Failed to delete goal', 
      message: error.message 
    });
  }
});

module.exports = router;

