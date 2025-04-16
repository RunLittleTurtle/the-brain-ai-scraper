// Local MCP types to avoid SDK import resolution issues
export interface McpToolDefinition {
  id: string;
  name?: string;
  description?: string;
  inputSchema?: Record<string, any>;
  outputSchema?: Record<string, any>;
  annotations?: Record<string, any>;
  protocol?: string;
  version?: string;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
}

export interface McpInvokePayload {
  toolName: string; 
  input: any;      
}
