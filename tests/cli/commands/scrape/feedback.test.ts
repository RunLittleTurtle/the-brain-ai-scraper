/**
 * Tests for Feedback Commands
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import ora from 'ora';
import * as utils from '../../../../src/cli/commands/scrape/utils.js';
import { registerFeedbackCommands } from '../../../../src/cli/commands/scrape/feedback.js';

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
  API_BASE_URL: 'http://test-api.local'
}));

describe('Feedback Commands', () => {
  let program: Command;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let processExitSpy: any;
  
  beforeEach(() => {
    program = new Command();
    registerFeedbackCommands(program);
    
    // Spy on console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock process.exit
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  describe('Proposal Feedback Command', () => {
    it('should submit proposal approval successfully', async () => {
      // Mock successful API response
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          job_id: 'test-job-123',
          status: 'processing',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      };
      
      (utils.makeApiRequest as any).mockResolvedValue(mockResponse);
      
      // Find the action handler
      const proposalCommand = program.commands.find(cmd => cmd.name() === 'approve-proposal');
      if (!proposalCommand) {
        throw new Error('Proposal command not found');
      }
      
      // Execute the command with approval
      await proposalCommand.parseAsync(['node', 'test', 'job-123', '--approve']);
      
      // Verify API request was made correctly
      expect(utils.makeApiRequest).toHaveBeenCalledWith(
        '/api/v1/scrapes/job-123/proposal-feedback',
        'POST',
        expect.objectContaining({
          approved: true
        })
      );
      
      // Verify success message was displayed
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(processExitSpy).not.toHaveBeenCalled();
    });
    
    it('should reject when neither approve nor reject is specified', async () => {
      // Find the action handler
      const proposalCommand = program.commands.find(cmd => cmd.name() === 'approve-proposal');
      if (!proposalCommand) {
        throw new Error('Proposal command not found');
      }
      
      // Execute without approve/reject flags
      await proposalCommand.parseAsync(['node', 'test', 'job-123']);
      
      // Verify error message and exit
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(1);
      expect(utils.makeApiRequest).not.toHaveBeenCalled();
    });
  });
  
  describe('Sample Feedback Command', () => {
    it('should submit sample approval successfully', async () => {
      // Mock successful API response
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          job_id: 'test-job-123',
          status: 'processing',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      };
      
      (utils.makeApiRequest as any).mockResolvedValue(mockResponse);
      
      // Find the action handler
      const samplesCommand = program.commands.find(cmd => cmd.name() === 'approve-samples');
      if (!samplesCommand) {
        throw new Error('Samples command not found');
      }
      
      // Execute the command with approval and field issues
      await samplesCommand.parseAsync([
        'node', 'test', 'job-123', 
        '--approve', 
        '--field-issues', 'title:Missing capitalization,price:Wrong format'
      ]);
      
      // Verify API request was made correctly
      expect(utils.makeApiRequest).toHaveBeenCalledWith(
        '/api/v1/scrapes/job-123/sample-feedback',
        'POST',
        expect.objectContaining({
          approved: true,
          field_issues: {
            title: 'Missing capitalization',
            price: 'Wrong format'
          }
        })
      );
      
      // Verify success message was displayed
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(processExitSpy).not.toHaveBeenCalled();
    });
    
    it('should handle API errors', async () => {
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
      const samplesCommand = program.commands.find(cmd => cmd.name() === 'approve-samples');
      if (!samplesCommand) {
        throw new Error('Samples command not found');
      }
      
      // Execute the command
      await samplesCommand.parseAsync(['node', 'test', 'job-123', '--approve']);
      
      // Verify error handling
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });
});
