# Smart Task Planner

A web application that breaks down user goals into actionable tasks with timelines using AI reasoning. Built with a 3-tier architecture: React frontend, Node.js backend, and MySQL database.

## Features

- **Goal Input**: Submit goals in natural language (e.g., "Launch a product in 2 weeks")
- **AI-Powered Task Breakdown**: Automatically generates actionable tasks with:
  - Task descriptions and priorities
  - Estimated timelines and deadlines
  - Task dependencies
  - Logical task ordering
- **Task Management**: View, track, and update task status
- **Progress Tracking**: Visual progress indicators and completion statistics
- **Clean Modern UI**: Responsive design with intuitive user experience

## Architecture

### Frontend (React)
- React 18 with React Router
- Modern, responsive UI components
- Axios for API communication

### Backend (Node.js/Express)
- RESTful API endpoints
- Express.js server
- Input validation and error handling

### Database (MySQL)
- Goals and tasks storage
- Relationship management
- Automatic schema initialization

### AI Integration
- OpenAI GPT-4 for intelligent task breakdown
- Dependency analysis and timeline calculation

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- OpenAI API key

## Installation

1. **Clone the repository** (if applicable) or navigate to the project directory

2. **Install dependencies for all tiers:**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables:**

   Create `backend/.env` file:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=smart_task_planner
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Set up MySQL database:**
   - Make sure MySQL is running
   - The database and tables will be created automatically when you start the backend server

## Running the Application

### Development Mode (Runs both frontend and backend)

```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend development server on `http://localhost:3000`

### Run Separately

**Backend only:**
```bash
npm run server
```

**Frontend only:**
```bash
npm run client
```

## API Endpoints

### Goals
- `POST /api/goals` - Create a new goal and generate task breakdown
- `GET /api/goals` - Get all goals
- `GET /api/goals/:id` - Get a specific goal with tasks
- `DELETE /api/goals/:id` - Delete a goal

### Tasks
- `PATCH /api/goals/tasks/:id` - Update task status

### Health Check
- `GET /api/health` - Check API status

## Project Structure

```
smart-task-planner/
├── backend/
│   ├── config/
│   │   └── database.js       # Database configuration and initialization
│   ├── controllers/
│   │   └── goalController.js # Business logic for goals and tasks
│   ├── routes/
│   │   └── goals.js          # API route definitions
│   ├── services/
│   │   └── aiService.js       # OpenAI integration for task breakdown
│   ├── .env.example           # Environment variables template
│   ├── package.json
│   └── server.js              # Express server entry point
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── services/         # API service functions
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
├── package.json              # Root package.json for scripts
└── README.md
```

## Usage

1. **Create a Goal:**
   - Enter your goal in natural language (minimum 10 characters)
   - Click "Generate Task Plan"
   - Wait for AI to analyze and break down your goal

2. **View Task Plan:**
   - See all generated tasks with descriptions
   - View dependencies between tasks
   - Check estimated timelines and deadlines

3. **Track Progress:**
   - Update task status (Pending → In Progress → Completed)
   - Monitor overall progress with visual indicators
   - Tasks blocked by dependencies will be highlighted

4. **Manage Goals:**
   - View all your goals on the home page
   - Access detailed views for each goal
   - Delete goals when no longer needed

## Configuration

### Backend Configuration
Edit `backend/.env` to configure:
- Database connection settings
- Server port
- OpenAI API key

### Frontend Configuration
The frontend is configured to proxy API requests to `http://localhost:5000` by default. To change this, update the `proxy` field in `frontend/package.json` or set `REACT_APP_API_URL` environment variable.

## Technologies Used

- **Frontend**: React, React Router, Axios, CSS3
- **Backend**: Node.js, Express.js, MySQL2
- **AI**: OpenAI GPT-4
- **Database**: MySQL
- **Development**: Nodemon, Concurrently

## License

MIT

