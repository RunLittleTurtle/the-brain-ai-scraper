/**
 * Create Scrape Command
 * 
 * Handles creation of new scrape jobs
 */
import { Command } from 'commander';
// Define command type to avoid TypeScript issues
type CommandType = typeof Command.prototype;
import chalk from 'chalk';
import ora from 'ora';
import { CreateScrapeOptions, ApiResponse } from './types.js';
import { makeApiRequest, formatErrorMessage, displayPerformanceMetrics } from './utils.js';

export function registerCreateCommand(program: CommandType): void {
  program
    .command('create')
    .description('Create a new scrape job')
    .argument('<objective>', 'User objective for the scraping task')
    .option('-u, --urls <urls>', 'Target URLs as comma-separated string')
    .option('-m, --max-results <number>', 'Maximum number of results to retrieve')
    .option('-c, --context <json>', 'Additional context as JSON string')
    .option('-o, --orchestration-mode <mode>', 'Tool orchestration mode (classic, mcp, dual)', 'default')
    .action(async (objective: string, options: CreateScrapeOptions) => {
      const spinner = ora('Creating scrape job...').start();
      
      try {
        // Parse URLs
        const urls = options.urls ? options.urls.split(',').map(url => url.trim()) : [];
        
        // Parse additional context
        let additionalContext = null;
        if (options.context) {
          try {
            additionalContext = JSON.parse(options.context);
          } catch (error) {
            spinner.fail(chalk.red('Error: Invalid JSON for additional context'));
            process.exit(1);
          }
        }
        
        // Prepare request payload
        const payload = {
          user_objective: objective,
          target_urls: urls,
          max_results: options.maxResults ? parseInt(options.maxResults, 10) : undefined,
          additional_context: additionalContext,
          orchestration_mode: options.orchestrationMode
        };
        
        // Send request to API
        const response = await makeApiRequest('/api/v1/scrapes', 'POST', payload);
        
        // Handle response
        if (!response.ok) {
          const errorData = await response.json() as any;
          spinner.fail(chalk.red(`Error: ${errorData.message || 'Failed to create scrape job'}`));
          process.exit(1);
        }
        
        const data = await response.json() as ApiResponse;
        spinner.succeed(chalk.green(`Scrape job created: ${data.job_id}`));
        
        // Display additional info
        console.log(chalk.blue(`Status: ${data.status}`));
        console.log(chalk.blue(`Created: ${new Date(data.created_at).toLocaleString()}`));
        
        // Display orchestration mode info if available
        if (options.orchestrationMode && options.orchestrationMode !== 'default') {
          console.log(chalk.yellow(`Orchestration Mode: ${options.orchestrationMode}`));
        }
        
        // Display performance metrics for dual mode
        displayPerformanceMetrics(data);
        
        console.log(chalk.gray(`\nTo check status: brain scrape status ${data.job_id}`));
        
      } catch (error) {
        spinner.fail(chalk.red(`Error: ${formatErrorMessage(error)}`));
        process.exit(1);
      }
    });
}
