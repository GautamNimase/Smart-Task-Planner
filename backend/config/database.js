const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smart_task_planner',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool = null;

const getPool = () => {
  if (!pool) {
    throw new Error('Database not initialized. Please ensure MySQL is running and configured in .env file.');
  }
  return pool;
};

const initDatabase = async () => {
  try {
    // First, connect without database to create it if it doesn't exist
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await connection.end();

    // Now create pool with database
    pool = mysql.createPool(dbConfig);

    // Create tables
    await createTables();
    console.log('Database initialized successfully');
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('\n❌ MySQL Connection Error:');
      console.error('   MySQL server is not running or not accessible.');
      console.error('   Please ensure MySQL is installed and running.');
      console.error(`   Attempted to connect to: ${dbConfig.host}:3306`);
      console.error('   Check your .env file for correct database credentials.\n');
    } else {
      console.error('Database initialization error:', error.message);
    }
    throw error;
  }
};

const createTables = async () => {
  const pool = getPool();

  // Goals table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS goals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      goal_text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // Tasks table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      goal_id INT NOT NULL,
      title VARCHAR(500) NOT NULL,
      description TEXT,
      estimated_days INT,
      start_date DATE,
      end_date DATE,
      status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
      priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
      dependencies JSON,
      task_order INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
      INDEX idx_goal_id (goal_id),
      INDEX idx_status (status)
    )
  `);

  console.log('Tables created successfully');
};

module.exports = {
  getPool,
  initDatabase
};

