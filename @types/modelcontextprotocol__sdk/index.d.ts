// Minimal type declaration for @modelcontextprotocol/sdk for TS resolution
// Remove if/when official types are published

export interface ToolDefinition {
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

export interface InvokeRequest {
  toolId: string;
  params: Record<string, any>;
}
