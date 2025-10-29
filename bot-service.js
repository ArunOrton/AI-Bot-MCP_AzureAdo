const express = require('express');
const { CloudAdapter, ConfigurationBotFrameworkAuthentication } = require('botbuilder');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3978;

// Bot Framework Authentication (modern approach)
const botFrameworkAuthentication = new ConfigurationBotFrameworkAuthentication({
  MicrosoftAppId: process.env.MICROSOFT_APP_ID || '',
  MicrosoftAppPassword: process.env.MICROSOFT_APP_PASSWORD || '',
  MicrosoftAppType: process.env.MICROSOFT_APP_TYPE || 'MultiTenant'
});

// Cloud Adapter (replaces deprecated BotFrameworkAdapter)
const adapter = new CloudAdapter(botFrameworkAuthentication);

// Error handler
adapter.onTurnError = async (context, error) => {
  console.error(`\n [onTurnError] unhandled error: ${error}`);
  await context.sendActivity('The bot encountered an error or bug.');
  await context.sendActivity('Please check your bot logs for more information.');
};


// OpenAI API Client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-dummy-key'
});

// MCP Client
const mcpClient = new MCPClient(process.env.MCP_SERVER_URL || 'http://localhost:3001');

// Conversation history storage (in production, use Redis/CosmosDB)
const conversationHistory = new Map();

// Bot message handler
app.post('/api/messages', async (req, res) => {
  await adapter.process(req, res, async (context) => {
    if (context.activity.type === 'message') {
      const userMessage = context.activity.text;
      const conversationId = context.activity.conversation.id;
      
      console.log(`[${conversationId}] User: ${userMessage}`);
      
      try {
        // Get or create conversation history
        if (!conversationHistory.has(conversationId)) {
          conversationHistory.set(conversationId, []);
        }
        const history = conversationHistory.get(conversationId);
        
        // Add user message to history
        history.push({
          role: 'user',
          content: userMessage
        });
        
        // Get available MCP tools
        const tools = await mcpClient.listTools();
        
        // Call OpenAI with MCP tools
        let response = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: 'You are an Azure DevOps assistant bot. Help users manage work items, pull requests, builds, tests, and deployments. Use the available tools to fetch real-time data from Azure DevOps.'
            },
            ...history
          ],
          tools: tools,
          tool_choice: 'auto'
        });
        
        console.log(`[${conversationId}] OpenAI response type: ${response.choices[0].finish_reason}`);
        
        // Handle tool calls
        if (response.choices[0].finish_reason === 'tool_calls') {
          const toolCalls = response.choices[0].message.tool_calls;
          
          // Add assistant's tool call message to history
          history.push(response.choices[0].message);
          
          // Execute each tool call
          for (const toolCall of toolCalls) {
            console.log(`[${conversationId}] Executing tool: ${toolCall.function.name}`);
            
            const functionArgs = JSON.parse(toolCall.function.arguments);
            
            // Execute MCP tool
            const result = await mcpClient.executeTool(
              toolCall.function.name,
              functionArgs
            );
            
            // Add tool result to history
            history.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: toolCall.function.name,
              content: JSON.stringify(result)
            });
          }
          
          // Get final response from OpenAI with tool results
          response = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
            messages: [
              {
                role: 'system',
                content: 'You are an Azure DevOps assistant bot. Help users manage work items, pull requests, builds, tests, and deployments. Provide clear, concise responses based on the tool results.'
              },
              ...history
            ],
            tools: tools,
            tool_choice: 'auto'
          });
        }
        
        // Extract text response
        const botReply = response.choices[0].message.content;
        
        // Add assistant response to history
        history.push({
          role: 'assistant',
          content: botReply
        });
        
        await context.sendActivity(botReply);
        
        // Keep only last 20 messages to manage token limits
        if (history.length > 20) {
          conversationHistory.set(conversationId, history.slice(-20));
        }
        
      } catch (error) {
        console.error(`[${conversationId}] Error:`, error);
        await context.sendActivity('Sorry, I encountered an error processing your request. Please try again.');
      }
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Bot service listening on port ${PORT}`);
  console.log(`MCP Server: ${process.env.MCP_SERVER_URL || 'http://localhost:3001'}`);
  console.log(`OpenAI Model: ${process.env.OPENAI_MODEL || 'gpt-4-turbo-preview'}`);
});