/**
 * Tests for Create Scrape Command
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import ora from 'ora';
import * as utils from '../../../../src/cli/commands/scrape/utils.js';
import { registerCreateCommand } from '../../../../src/cli/commands/scrape/create.js';

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

describe('Create Scrape Command', () => {
  let program: Command;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let processExitSpy: any;
  
  beforeEach(() => {
    program = new Command();
    registerCreateCommand(program);
    
    // Spy on console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock process.exit
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  it('should create a scrape job successfully', async () => {
    // Mock successful API response
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        job_id: 'test-job-123',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    };
    
    (utils.makeApiRequest as any).mockResolvedValue(mockResponse);
    
    // Find the action handler
    const createCommand = program.commands.find(cmd => cmd.name() === 'create');
    if (!createCommand) {
      throw new Error('Create command not found');
    }
    
    // Execute the command with test arguments
    await createCommand.parseAsync(['node', 'test', 'Test objective', '--urls', 'https://example.com']);
    
    // Verify API request was made correctly
    expect(utils.makeApiRequest).toHaveBeenCalledWith(
      '/api/v1/scrapes',
      'POST',
      expect.objectContaining({
        user_objective: 'Test objective',
        target_urls: ['https://example.com']
      })
    );
    
    // Verify spinner was used correctly
    expect(ora).toHaveBeenCalledWith('Creating scrape job...');
    
    // Verify success message was displayed
    expect(consoleLogSpy).toHaveBeenCalled();
    expect(processExitSpy).not.toHaveBeenCalled();
  });
  
  it('should handle errors when creating a scrape job', async () => {
    // Mock error API response
    const mockResponse = {
      ok: false,
      json: vi.fn().mockResolvedValue({
        error: 'Test error',
        message: 'Something went wrong'
      })
    };
    
    (utils.makeApiRequest as any).mockResolvedValue(mockResponse);
    
    // Find the action handler
    const createCommand = program.commands.find(cmd => cmd.name() === 'create');
    if (!createCommand) {
      throw new Error('Create command not found');
    }
    
    // Execute the command with test arguments
    await createCommand.parseAsync(['node', 'test', 'Test objective']);
    
    // Verify error handling
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});
