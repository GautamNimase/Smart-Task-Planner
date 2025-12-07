const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const goalRoutes = require('./routes/goals');
const { initDatabase } = require('./config/database');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/goals', goalRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Smart Task Planner API is running' });
});

// Initialize database and start server
let dbInitialized = false;

initDatabase()
  .then(() => {
    dbInitialized = true;
    console.log('✅ Database connected successfully');
    startServer();
  })
  .catch((error) => {
    console.warn('⚠️  Database connection failed. Server will start in limited mode.');
    console.warn('   Some features may not work until database is configured.');
    console.warn('   Error:', error.message);
    startServer();
  });

function startServer() {
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    if (!dbInitialized) {
      console.log('⚠️  Note: Database not connected - configure MySQL to enable full functionality');
    }
    // Check AI provider configuration
    const { getAIProvider } = require('./services/aiService');
    try {
      const provider = getAIProvider();
      if (provider === 'groq') {
        const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
        console.log(`🤖 Using Groq AI (${model}) - set GROQ_MODEL in .env to change`);
      } else {
        const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
        console.log(`🤖 Using OpenAI (${model}) - set OPENAI_MODEL in .env to change`);
      }
    } catch (error) {
      console.log('⚠️  Note: AI API key not configured - AI task breakdown will not work');
      console.log('   Configure either GROQ_API_KEY or OPENAI_API_KEY in .env file');
    }
    console.log(`📡 API available at http://localhost:${PORT}/api\n`);
  });
}

