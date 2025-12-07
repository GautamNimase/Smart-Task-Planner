const OpenAI = require('openai');
const Groq = require('groq-sdk');
const dotenv = require('dotenv');

dotenv.config();

let openai = null;
let groq = null;

// Determine which AI provider to use
const getAIProvider = () => {
  const provider = process.env.AI_PROVIDER?.toLowerCase() || 'auto';
  
  // Explicit provider selection
  if (provider === 'groq') {
    return 'groq';
  } else if (provider === 'openai') {
    return 'openai';
  }
  
  // Auto-detect: check both GROQ_API_KEY and OPENAI_API_KEY
  const groqKey = process.env.GROQ_API_KEY?.trim();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  
  // Check if Groq key is in GROQ_API_KEY
  if (groqKey && groqKey !== 'your_groq_api_key_here' && groqKey !== '' && groqKey.startsWith('gsk_')) {
    return 'groq';
  }
  
  // Check if Groq key is mistakenly in OPENAI_API_KEY (auto-fix)
  if (openaiKey && openaiKey !== 'your_openai_api_key_here' && openaiKey !== '' && openaiKey.startsWith('gsk_')) {
    console.warn('⚠️  Warning: Groq API key detected in OPENAI_API_KEY. Using Groq automatically.');
    console.warn('   Consider moving it to GROQ_API_KEY for clarity.');
    return 'groq';
  }
  
  // Use OpenAI if OPENAI_API_KEY is set and valid (starts with sk-)
  if (openaiKey && openaiKey !== 'your_openai_api_key_here' && openaiKey !== '' && openaiKey.startsWith('sk-')) {
    return 'openai';
  }
  
  // Fallback: if GROQ_API_KEY exists (even if invalid format), prefer Groq
  if (groqKey && groqKey !== 'your_groq_api_key_here' && groqKey !== '') {
    return 'groq';
  }
  
  // Default to openai if nothing else
  return 'openai';
};

const getOpenAIClient = () => {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey || apiKey === 'your_openai_api_key_here' || apiKey === '') {
      throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY in your .env file.');
    }
    
    // Detect if a Groq key is being used with OpenAI client
    // Note: This should rarely happen now since getAIProvider() will detect it first
    if (apiKey.startsWith('gsk_')) {
      throw new Error(
        'Invalid API key: A Groq API key (starts with gsk_) was detected in OPENAI_API_KEY. ' +
        'The system will automatically use Groq if you have a Groq key. ' +
        'To use OpenAI, please set a valid OpenAI API key (starts with sk-) in OPENAI_API_KEY. ' +
        'Alternatively, move your Groq key to GROQ_API_KEY and set AI_PROVIDER=groq.'
      );
    }
    
    if (!apiKey.startsWith('sk-')) {
      throw new Error(
        'Invalid OpenAI API key format. OpenAI API keys should start with "sk-". ' +
        'Please check your OPENAI_API_KEY in .env file.'
      );
    }
    
    openai = new OpenAI({
      apiKey: apiKey
    });
  }
  return openai;
};

const getGroqClient = () => {
  if (!groq) {
    // Check GROQ_API_KEY first, then fallback to OPENAI_API_KEY if it contains a Groq key
    let apiKey = process.env.GROQ_API_KEY?.trim();
    
    // If GROQ_API_KEY is not set, check OPENAI_API_KEY for a Groq key (auto-fix)
    if (!apiKey || apiKey === 'your_groq_api_key_here' || apiKey === '') {
      const openaiKey = process.env.OPENAI_API_KEY?.trim();
      if (openaiKey && openaiKey.startsWith('gsk_')) {
        console.warn('⚠️  Using Groq API key from OPENAI_API_KEY. Consider moving it to GROQ_API_KEY.');
        apiKey = openaiKey;
      } else {
        throw new Error('Groq API key is not configured. Please set GROQ_API_KEY in your .env file.');
      }
    }
    
    // Detect if an OpenAI key is being used with Groq client
    if (apiKey.startsWith('sk-')) {
      throw new Error(
        'Invalid API key: An OpenAI API key (starts with sk-) was detected. ' +
        'Please use a valid Groq API key (starts with gsk_) in GROQ_API_KEY. ' +
        'You can also set AI_PROVIDER=openai to use OpenAI.'
      );
    }
    
    if (!apiKey.startsWith('gsk_')) {
      throw new Error(
        'Invalid Groq API key format. Groq API keys should start with "gsk_". ' +
        'Please check your GROQ_API_KEY in .env file.'
      );
    }
    
    groq = new Groq({
      apiKey: apiKey
    });
  }
  return groq;
};

const breakDownGoal = async (goalText) => {
  try {
    const provider = getAIProvider();
    const prompt = `You are a professional project planner. Break down the following goal into actionable tasks with suggested deadlines and dependencies.

Goal: "${goalText}"

Please provide a detailed task breakdown in JSON format with the following structure:
{
  "tasks": [
    {
      "title": "Task name",
      "description": "Detailed description of what needs to be done",
      "estimated_days": number of days needed,
      "priority": "low" | "medium" | "high",
      "dependencies": [array of task titles this task depends on, empty array if none],
      "task_order": order number (1, 2, 3, etc.)
    }
  ],
  "reasoning": "Brief explanation of the breakdown strategy and timeline logic"
}

Important guidelines:
- Break down the goal into specific, actionable tasks
- Consider realistic timelines based on the goal complexity
- Identify dependencies between tasks (which tasks must be completed before others)
- Prioritize tasks appropriately
- Ensure tasks are sequential and logical
- Return ONLY valid JSON, no additional text or markdown formatting`;

    let response;
    let model;

    if (provider === 'groq') {
      const groqClient = getGroqClient();
      // Groq models: llama-3.3-70b-versatile (recommended), llama-3.1-8b-instant, llama-3-70b-8192, llama-3-8b-8192
      model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
      
      response = await groqClient.chat.completions.create({
        model: model,
        messages: [
          {
            role: "system",
            content: "You are an expert project planner that breaks down goals into actionable tasks. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });
    } else {
      const openaiClient = getOpenAIClient();
      // OpenAI models: gpt-3.5-turbo, gpt-4, gpt-4-turbo-preview, etc.
      model = process.env.OPENAI_MODEL || "gpt-3.5-turbo";
      
      response = await openaiClient.chat.completions.create({
        model: model,
        messages: [
          {
            role: "system",
            content: "You are an expert project planner that breaks down goals into actionable tasks. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });
    }

    const content = response.choices[0].message.content.trim();
    
    // Clean up the response to extract JSON
    let jsonContent = content;
    
    // Remove markdown code blocks if present
    if (content.startsWith('```json')) {
      jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    } else if (content.startsWith('```')) {
      jsonContent = content.replace(/```\n?/g, '').trim();
    }

    const result = JSON.parse(jsonContent);
    
    // Calculate start and end dates for each task
    const tasksWithDates = calculateTaskDates(result.tasks);
    
    return {
      tasks: tasksWithDates,
      reasoning: result.reasoning || 'Task breakdown generated based on goal analysis'
    };
  } catch (error) {
    console.error('AI Service Error:', error);
    console.error('Error status:', error.status || error.statusCode);
    console.error('Error code:', error.code);
    
    const provider = getAIProvider();
    
    // Check for quota/billing errors (429 status or quota-related messages)
    const isQuotaError = error.status === 429 || 
                        error.statusCode === 429 ||
                        (error.message && (
                          error.message.includes('insufficient_quota') || 
                          error.message.includes('exceeded your current quota') ||
                          error.message.includes('quota') ||
                          error.message.includes('billing') ||
                          error.message.includes('rate limit')
                        ));
    
    // Provide helpful error messages for common issues
    if (isQuotaError) {
      if (provider === 'groq') {
        throw new Error(
          'Groq API rate limit exceeded. Please wait a moment and try again. ' +
          'Check your usage at https://console.groq.com/usage'
        );
      } else {
        throw new Error(
          'OpenAI API quota exceeded. You have reached your usage limit. ' +
          'Please check your OpenAI account billing and usage limits at https://platform.openai.com/account/billing. ' +
          'You may need to add a payment method or upgrade your plan. ' +
          'For more information, see: https://platform.openai.com/docs/guides/error-codes/api-errors'
        );
      }
    } else if (error.message && (error.message.includes('does not exist or you do not have access') || 
                                  error.message.includes('model_decommissioned') ||
                                  error.message.includes('decommissioned'))) {
      const model = provider === 'groq' 
        ? (process.env.GROQ_MODEL || "llama-3.3-70b-versatile")
        : (process.env.OPENAI_MODEL || "gpt-3.5-turbo");
      
      if (error.message.includes('decommissioned')) {
        throw new Error(
          `The model "${model}" has been decommissioned and is no longer available. ` +
          `Please update GROQ_MODEL in your .env file to a current model. ` +
          `Recommended models: llama-3.3-70b-versatile (latest), llama-3.1-8b-instant, llama-3-70b-8192, llama-3-8b-8192. ` +
          `See https://console.groq.com/docs/models for available models.`
        );
      }
      
      throw new Error(
        `The model "${model}" is not available or you don't have access to it. ` +
        `Please use a different model by setting ${provider === 'groq' ? 'GROQ_MODEL' : 'OPENAI_MODEL'} in your .env file.`
      );
    } else if (error.status === 401 || error.code === 'invalid_api_key' || 
               (error.message && (error.message.includes('invalid_api_key') || error.message.includes('Incorrect API key')))) {
      // Check if wrong provider is being used
      const groqKey = process.env.GROQ_API_KEY?.trim();
      const openaiKey = process.env.OPENAI_API_KEY?.trim();
      
      if (provider === 'openai' && groqKey && groqKey.startsWith('gsk_')) {
        throw new Error(
          'API key mismatch: You have a Groq API key configured but are trying to use OpenAI. ' +
          'Please either: 1) Set GROQ_API_KEY and AI_PROVIDER=groq, or 2) Set a valid OpenAI API key (starts with sk-) in OPENAI_API_KEY.'
        );
      } else if (provider === 'groq' && openaiKey && openaiKey.startsWith('sk-')) {
        throw new Error(
          'API key mismatch: You have an OpenAI API key configured but are trying to use Groq. ' +
          'Please either: 1) Set OPENAI_API_KEY and AI_PROVIDER=openai, or 2) Set a valid Groq API key (starts with gsk_) in GROQ_API_KEY.'
        );
      }
      
      const keyName = provider === 'groq' ? 'GROQ_API_KEY' : 'OPENAI_API_KEY';
      throw new Error(
        `Invalid ${provider === 'groq' ? 'Groq' : 'OpenAI'} API key. Please check your ${keyName} in .env file. ` +
        `Make sure you're using the correct API key format (${provider === 'groq' ? 'gsk_' : 'sk-'}...).`
      );
    }
    
    throw new Error(`Failed to generate task breakdown: ${error.message}`);
  }
};

const calculateTaskDates = (tasks) => {
  const today = new Date();
  const taskMap = new Map();
  const completedTasks = new Set();
  
  // Create a map of tasks by title for dependency lookup
  tasks.forEach(task => {
    taskMap.set(task.title, task);
  });

  const calculateDatesForTask = (taskTitle) => {
    if (completedTasks.has(taskTitle)) {
      return taskMap.get(taskTitle);
    }

    const task = taskMap.get(taskTitle);
    const dependencies = task.dependencies || [];
    
    let startDate = new Date(today);
    
    // If task has dependencies, start after the latest dependency ends
    if (dependencies.length > 0) {
      dependencies.forEach(depTitle => {
        const depTask = calculateDatesForTask(depTitle);
        if (depTask && depTask.end_date) {
          const depEndDate = new Date(depTask.end_date);
          if (depEndDate > startDate) {
            startDate = new Date(depEndDate);
            startDate.setDate(startDate.getDate() + 1); // Start the day after dependency ends
          }
        }
      });
    }

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (task.estimated_days || 1) - 1);

    task.start_date = startDate.toISOString().split('T')[0];
    task.end_date = endDate.toISOString().split('T')[0];
    
    completedTasks.add(taskTitle);
    return task;
  };

  // Process tasks in order
  const sortedTasks = [...tasks].sort((a, b) => a.task_order - b.task_order);
  sortedTasks.forEach(task => {
    calculateDatesForTask(task.title);
  });

  return tasks;
};

module.exports = {
  breakDownGoal,
  getAIProvider
};

