// src/mcp-server/simple-mcp-client.ts

import axios from 'axios';
import { EventSource } from 'eventsource'; // Use named import
import type { McpToolDefinition, McpInvokePayload } from './mcp-types.js'; // Keep using local types for now

// TODO: Define the structure of the event object expected from SSE
interface McpEvent {
  // Define properties based on expected SSE message structure
  type: string;
  payload: any;
}

export class SimpleMCPClient {
  constructor(private rpcUrl: string, private sseUrl: string) {
    if (!rpcUrl || !sseUrl) {
        throw new Error('SimpleMCPClient requires RPC_URL and SSE_URL.');
    }
  }

  async listTools(): Promise<McpToolDefinition[]> {
    console.log(`Sending list_tools request to ${this.rpcUrl}`);
    const { data } = await axios.post(this.rpcUrl, {
      jsonrpc: '2.0', 
      id: Date.now(), // Use timestamp or uuid for unique ID
      method: 'list_tools', 
      params: {}
    });
    if (data.error) {
        console.error('MCP Error (list_tools):', data.error);
        throw new Error(`MCP Error: ${data.error.message} (Code: ${data.error.code})`);
    }
    console.log('Received list_tools response:', data.result);
    // TODO: Add validation if necessary (e.g., using Zod)
    return data.result as McpToolDefinition[];
  }

  async callTool(payload: McpInvokePayload): Promise<any> {
    console.log(`Sending invoke_tool request to ${this.rpcUrl}:`, payload);
    // The MCP protocol typically expects 'name' and 'args' within params
    const { data } = await axios.post(this.rpcUrl, {
      jsonrpc: '2.0', 
      id: Date.now(), // Use timestamp or uuid for unique ID
      method: 'invoke_tool',
      params: { 
        name: payload.toolName, // Map from McpInvokePayload
        args: payload.input     // Map from McpInvokePayload
      }
    });
    if (data.error) {
        console.error('MCP Error (invoke_tool):', data.error);
        throw new Error(`MCP Error: ${data.error.message} (Code: ${data.error.code})`);
    }
    console.log('Received invoke_tool response:', data.result);
    // TODO: Add validation if necessary
    return data.result;
  }

  subscribeEvents(onEvent: (event: McpEvent) => void): () => void {
    console.log(`Connecting to SSE endpoint: ${this.sseUrl}`);
    const es = new EventSource(this.sseUrl);

    es.onopen = () => {
        console.log('SSE connection established.');
    };

    es.onmessage = (e: MessageEvent) => { // Add MessageEvent type
        try {
            console.log('Received SSE message:', e.data);
            const eventData = JSON.parse(e.data) as McpEvent;
            // TODO: Add validation if necessary
            onEvent(eventData);
        } catch (error) {
            console.error('Failed to parse SSE message:', error, 'Raw data:', e.data);
        }
    };

    es.onerror = (err: Event) => { // Add Event type
        console.error('SSE Error:', err);
        // Optionally, attempt reconnection or handle specific errors
        // Note: EventSource handles reconnection automatically by default
    };

    // Return a function to close the connection
    return () => {
        console.log('Closing SSE connection.');
        es.close();
    };
  }
}
