/ ============================================
// USAGE INSTRUCTIONS
// ============================================
/*
1. Install dependencies:
   npm install

2. Set up environment variables in .env file

3. Start both services:
   npm run dev
   
   OR start separately:
   Terminal 1: npm start (bot service on port 3978)
   Terminal 2: npm run start:mcp (MCP server on port 3001)

4. Test with sample bot messages:
   - "Show me all user stories in current sprint for ProjectAlpha"
   - "Create a high priority bug for login issue"
   - "What PRs need review?"
   - "Get build status for MainPipeline"
   - "Show test results for build 8902"

5. For production:
   - Replace mock Azure DevOps client with real API calls
   - Add proper authentication and error handling
   - Use Redis/CosmosDB for conversation history
   - Deploy to Azure App Service
   - Set up proper logging and monitoring
*/