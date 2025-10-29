const express = require('express');
const app = express();
const PORT = process.env.MCP_PORT || 3001;

app.use(express.json());

// Mock Azure DevOps API client
const adoClient = new AzureDevOpsClient(
  process.env.ADO_ORG_URL || 'https://dev.azure.com/contoso',
  process.env.ADO_PAT || 'dummy-pat-token'
);

// MCP Tool Definitions (OpenAI compatible format)
const MCP_TOOLS = [
  {
    name: 'get_work_items',
    description: 'Get work items from Azure DevOps by query or IDs. Returns bugs, tasks, user stories, and features with their current state, assignee, and priority.',
    inputSchema: {
      type: 'object',
      properties: {
        project: { 
          type: 'string', 
          description: 'Project name (e.g., "ProjectAlpha")' 
        },
        ids: { 
          type: 'array', 
          items: { type: 'number' }, 
          description: 'Specific work item IDs to fetch' 
        },
        wiql: { 
          type: 'string', 
          description: 'Work Item Query Language query for advanced filtering' 
        },
        type: { 
          type: 'string', 
          enum: ['Bug', 'Task', 'User Story', 'Feature'],
          description: 'Filter by work item type'
        }
      },
      required: ['project']
    }
  },
  {
    name: 'create_work_item',
    description: 'Create a new work item (bug, task, user story, or feature) in Azure DevOps with title, description, priority, and assignment.',
    inputSchema: {
      type: 'object',
      properties: {
        project: { type: 'string', description: 'Project name' },
        type: { 
          type: 'string', 
          enum: ['Bug', 'Task', 'User Story', 'Feature'],
          description: 'Type of work item to create'
        },
        title: { type: 'string', description: 'Work item title' },
        description: { type: 'string', description: 'Detailed description' },
        priority: { 
          type: 'number', 
          minimum: 1, 
          maximum: 4,
          description: '1=Highest, 2=High, 3=Medium, 4=Low'
        },
        assignedTo: { type: 'string', description: 'User email or name to assign' }
      },
      required: ['project', 'type', 'title']
    }
  },
  {
    name: 'get_pull_requests',
    description: 'List pull requests in a repository with their status, reviewers, and review votes. Useful for finding PRs that need review.',
    inputSchema: {
      type: 'object',
      properties: {
        project: { type: 'string', description: 'Project name' },
        repository: { type: 'string', description: 'Repository name' },
        status: { 
          type: 'string', 
          enum: ['active', 'completed', 'abandoned', 'all'],
          description: 'Filter by PR status'
        },
        createdBy: { type: 'string', description: 'Filter by PR creator' },
        reviewerId: { type: 'string', description: 'Filter by reviewer email' }
      },
      required: ['project', 'repository']
    }
  },
  {
    name: 'get_build',
    description: 'Get build/pipeline details including status (succeeded, failed, in progress), duration, and results. Use to check CI/CD pipeline status.',
    inputSchema: {
      type: 'object',
      properties: {
        project: { type: 'string', description: 'Project name' },
        buildId: { type: 'number', description: 'Specific build ID' },
        definitionName: { type: 'string', description: 'Build pipeline/definition name' },
        top: { 
          type: 'number', 
          description: 'Number of recent builds to return',
          default: 10 
        }
      },
      required: ['project']
    }
  },
  {
    name: 'get_test_results',
    description: 'Get test results for a build or test run including pass/fail status, test names, and error messages. Useful for analyzing test failures.',
    inputSchema: {
      type: 'object',
      properties: {
        project: { type: 'string', description: 'Project name' },
        buildId: { type: 'number', description: 'Build ID to get tests for' },
        runId: { type: 'number', description: 'Test run ID' },
        outcome: { 
          type: 'string', 
          enum: ['Passed', 'Failed', 'NotExecuted', 'All'],
          description: 'Filter by test outcome'
        }
      },
      required: ['project']
    }
  },
  {
    name: 'get_team_iteration',
    description: 'Get sprint/iteration information including dates, capacity, and velocity. Use to find current sprint or plan future sprints.',
    inputSchema: {
      type: 'object',
      properties: {
        project: { type: 'string', description: 'Project name' },
        team: { type: 'string', description: 'Team name' },
        timeframe: { 
          type: 'string', 
          enum: ['current', 'past', 'future'],
          description: 'Which iteration timeframe to query'
        }
      },
      required: ['project', 'team']
    }
  },
  {
    name: 'get_release',
    description: 'Get release and deployment information including environment status (dev, staging, production) and deployment times.',
    inputSchema: {
      type: 'object',
      properties: {
        project: { type: 'string', description: 'Project name' },
        releaseId: { type: 'number', description: 'Specific release ID' },
        definitionName: { type: 'string', description: 'Release definition/pipeline name' },
        environment: { 
          type: 'string', 
          description: 'Filter by environment (e.g., Production, Development)'
        }
      },
      required: ['project']
    }
  }
];

// List available tools
app.get('/tools', (req, res) => {
  res.json(MCP_TOOLS);
});

// Execute tool
app.post('/execute', async (req, res) => {
  const { tool, parameters } = req.body;
  
  console.log(`[MCP] Executing tool: ${tool}`, parameters);
  
  try {
    let result;
    
    switch (tool) {
      case 'get_work_items':
        result = await adoClient.getWorkItems(parameters);
        break;
      case 'create_work_item':
        result = await adoClient.createWorkItem(parameters);
        break;
      case 'get_pull_requests':
        result = await adoClient.getPullRequests(parameters);
        break;
      case 'get_build':
        result = await adoClient.getBuilds(parameters);
        break;
      case 'get_test_results':
        result = await adoClient.getTestResults(parameters);
        break;
      case 'get_team_iteration':
        result = await adoClient.getTeamIteration(parameters);
        break;
      case 'get_release':
        result = await adoClient.getReleases(parameters);
        break;
      default:
        result = { error: `Unknown tool: ${tool}` };
    }
    
    res.json(result);
  } catch (error) {
    console.error(`[MCP] Error executing ${tool}:`, error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`MCP Server listening on port ${PORT}`);
});