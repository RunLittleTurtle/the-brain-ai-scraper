/**
 * Tests for Status Scrape Command
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import ora from 'ora';
import * as utils from '../../../../src/cli/commands/scrape/utils.js';
import { registerStatusCommand } from '../../../../src/cli/commands/scrape/status.js';

// Mock dependencies
vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis()
  }))
}));

vi.mock('../../../../src/cli/commands/scrape/utils.js', () => ({
  makeApiRequest: vi.fn(),
  formatErrorMessage: vi.fn(error => `Formatted: ${error}`),
  displayPerformanceMetrics: vi.fn(),
  API_BASE_URL: 'http://test-api.local'
}));

describe('Status Scrape Command', () => {
  let program: Command;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let processExitSpy: any;
  let clearIntervalSpy: any;
  let setIntervalSpy: any;
  
  beforeEach(() => {
    program = new Command();
    registerStatusCommand(program);
    
    // Spy on console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy.mockClear();
    consoleErrorSpy.mockClear();
    
    // Mock process.exit
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    
    // Mock setInterval and clearInterval
    setIntervalSpy = vi.spyOn(global, 'setInterval').mockImplementation((fn) => {
      // Execute callback once immediately to simulate timer tick
      fn();
      return 1 as any;
    });
    
    clearIntervalSpy = vi.spyOn(global, 'clearInterval').mockImplementation(() => {});
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  it('should check status successfully', async () => {
    // Mock successful API response
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        job_id: 'test-job-123',
        status: 'in_progress',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        progress: {
          total_urls: 10,
          processed_urls: 5,
          percentage_complete: 50
        }
      })
    };
    
    (utils.makeApiRequest as any).mockResolvedValue(mockResponse);
    
    // Find the action handler
    const statusCommand = program.commands.find(cmd => cmd.name() === 'status');
    if (!statusCommand) {
      throw new Error('Status command not found');
    }
    
    // Execute the command with test arguments
    await statusCommand.parseAsync(['node', 'test', 'job-123']);
    
    // Verify API request was made correctly
    expect(utils.makeApiRequest).toHaveBeenCalledWith('/api/v1/scrapes/job-123/status');
    
    // Verify success
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(processExitSpy).not.toHaveBeenCalled();
  });
  
  it('should handle watch mode correctly', async () => {
    // Mock successful API response
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        job_id: 'test-job-123',
        status: 'in_progress',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        progress: {
          total_urls: 10,
          processed_urls: 5,
          percentage_complete: 50
        }
      })
    };
    
    (utils.makeApiRequest as any).mockResolvedValue(mockResponse);
    
    // Find the action handler
    const statusCommand = program.commands.find(cmd => cmd.name() === 'status');
    if (!statusCommand) {
      throw new Error('Status command not found');
    }
    
    // Execute the command with watch flag
    await statusCommand.parseAsync(['node', 'test', 'job-123', '--watch']);
    
    // Verify interval was set
    expect(setIntervalSpy).toHaveBeenCalled();
    
    // Verify API request
    expect(utils.makeApiRequest).toHaveBeenCalledWith('/api/v1/scrapes/job-123/status');
  });
  
  it('should handle errors correctly', async () => {
    // Mock error from API
    (utils.makeApiRequest as any).mockRejectedValue(new Error('Connection failed'));
    
    // Find the action handler
    const statusCommand = program.commands.find(cmd => cmd.name() === 'status');
    if (!statusCommand) {
      throw new Error('Status command not found');
    }
    
    // Execute the command
    await statusCommand.parseAsync(['node', 'test', 'job-123']);
    
    // Verify error handling
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});
