/**
 * Scrape Commands Index
 * 
 * Main entry point for scrape commands
 */
import { Command } from 'commander';
// Define command type to avoid TypeScript issues
type CommandType = typeof Command.prototype;
import { registerCreateCommand } from './create.js';
import { registerStatusCommand } from './status.js';
import { registerFeedbackCommands } from './feedback.js';
import { registerResultsCommand } from './results.js';

export function registerScrapeCommands(program: CommandType): void {
  // Create scrape command group
  const scrapeCommand = program
    .command('scrape')
    .description('Manage interactive scrape jobs');
  
  // Register subcommands
  registerCreateCommand(scrapeCommand);
  registerStatusCommand(scrapeCommand);
  registerFeedbackCommands(scrapeCommand);
  registerResultsCommand(scrapeCommand);
}
