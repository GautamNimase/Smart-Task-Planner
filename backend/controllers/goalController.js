const { getPool } = require('../config/database');
const { breakDownGoal } = require('../services/aiService');

const createGoal = async (goalText) => {
  let pool;
  let connection;
  
  try {
    pool = getPool();
  } catch (error) {
    throw new Error('Database not connected. Please ensure MySQL is running and configured in .env file.');
  }

  try {
    connection = await pool.getConnection();
  } catch (error) {
    throw new Error('Failed to get database connection. Please check your MySQL configuration.');
  }

  try {
    await connection.beginTransaction();

    // Insert goal
    const [goalResult] = await connection.query(
      'INSERT INTO goals (goal_text) VALUES (?)',
      [goalText]
    );
    const goalId = goalResult.insertId;

    // Generate task breakdown using AI
    let tasks, reasoning;
    try {
      const result = await breakDownGoal(goalText);
      tasks = result.tasks;
      reasoning = result.reasoning;
    } catch (aiError) {
      // If AI fails, rollback and provide helpful error
      await connection.rollback();
      if (aiError.message.includes('API key')) {
        throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY in your .env file.');
      }
      throw new Error(`AI service error: ${aiError.message}`);
    }

    // Insert tasks
    const taskPromises = tasks.map(task => {
      return connection.query(
        `INSERT INTO tasks 
         (goal_id, title, description, estimated_days, start_date, end_date, 
          status, priority, dependencies, task_order) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          goalId,
          task.title,
          task.description || '',
          task.estimated_days || 1,
          task.start_date || null,
          task.end_date || null,
          'pending',
          task.priority || 'medium',
          JSON.stringify(task.dependencies || []),
          task.task_order || 0
        ]
      );
    });

    await Promise.all(taskPromises);

    await connection.commit();

    // Fetch the complete goal with tasks
    const goal = await getGoalById(goalId, connection);
    return {
      ...goal,
      reasoning
    };
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const getAllGoals = async () => {
  let pool;
  try {
    pool = getPool();
  } catch (error) {
    throw new Error('Database not connected. Please ensure MySQL is running and configured in .env file.');
  }
  
  const [goals] = await pool.query(
    `SELECT g.*, 
     COUNT(t.id) as task_count,
     SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks
     FROM goals g
     LEFT JOIN tasks t ON g.id = t.goal_id
     GROUP BY g.id
     ORDER BY g.created_at DESC`
  );
  return goals;
};

const getGoalById = async (id, connection = null) => {
  let pool;
  if (connection) {
    pool = connection;
  } else {
    try {
      pool = getPool();
    } catch (error) {
      throw new Error('Database not connected. Please ensure MySQL is running and configured in .env file.');
    }
  }
  
  const [goals] = await pool.query(
    'SELECT * FROM goals WHERE id = ?',
    [id]
  );

  if (goals.length === 0) {
    return null;
  }

  const goal = goals[0];

  const [tasks] = await pool.query(
    `SELECT * FROM tasks 
     WHERE goal_id = ? 
     ORDER BY task_order ASC, id ASC`,
    [id]
  );

  // Parse JSON dependencies
  tasks.forEach(task => {
    if (task.dependencies) {
      try {
        task.dependencies = JSON.parse(task.dependencies);
      } catch (e) {
        task.dependencies = [];
      }
    } else {
      task.dependencies = [];
    }
  });

  return {
    ...goal,
    tasks
  };
};

const updateTaskStatus = async (taskId, status) => {
  let pool;
  try {
    pool = getPool();
  } catch (error) {
    throw new Error('Database not connected. Please ensure MySQL is running and configured in .env file.');
  }
  const [result] = await pool.query(
    'UPDATE tasks SET status = ? WHERE id = ?',
    [status, taskId]
  );

  if (result.affectedRows === 0) {
    return null;
  }

  const [tasks] = await pool.query(
    'SELECT * FROM tasks WHERE id = ?',
    [taskId]
  );

  const task = tasks[0];
  if (task.dependencies) {
    try {
      task.dependencies = JSON.parse(task.dependencies);
    } catch (e) {
      task.dependencies = [];
    }
  }

  return task;
};

const deleteGoal = async (id) => {
  let pool;
  try {
    pool = getPool();
  } catch (error) {
    throw new Error('Database not connected. Please ensure MySQL is running and configured in .env file.');
  }
  const [result] = await pool.query('DELETE FROM goals WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = {
  createGoal,
  getAllGoals,
  getGoalById,
  updateTaskStatus,
  deleteGoal
};

