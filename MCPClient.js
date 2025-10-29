class MCPClient {
  constructor(serverUrl) {
    this.serverUrl = serverUrl;
  }
  
  async listTools() {
    try {
      const response = await fetch(`${this.serverUrl}/tools`);
      const tools = await response.json();
      
      // Convert MCP tool format to OpenAI function calling format
      return tools.map(tool => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema
        }
      }));
    } catch (error) {
      console.error('Failed to list MCP tools:', error);
      return [];
    }
  }
  
  async executeTool(toolName, parameters) {
    try {
      const response = await fetch(`${this.serverUrl}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: toolName, parameters })
      });
      
      return await response.json();
    } catch (error) {
      console.error(`Failed to execute tool ${toolName}:`, error);
      return { error: error.message };
    }
  }
}