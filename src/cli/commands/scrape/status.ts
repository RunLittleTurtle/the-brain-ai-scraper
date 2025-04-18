/**
 * Status Command
 * 
 * Handles checking status of scrape jobs
 */
import { Command } from 'commander';
// Define command type to avoid TypeScript issues
type CommandType = typeof Command.prototype;
import chalk from 'chalk';
import ora from 'ora';
import { StatusOptions, ApiResponse } from './types.js';
import { makeApiRequest, formatErrorMessage, displayPerformanceMetrics } from './utils.js';

export function registerStatusCommand(program: CommandType): void {
  program
    .command('status')
    .description('Check status of a scrape job')
    .argument('<job_id>', 'ID of the scrape job')
    .option('-w, --watch', 'Watch mode - polls for updates')
    .option('-i, --interval <seconds>', 'Polling interval in seconds (default: 5)', '5')
    .action(async (jobId: string, options: StatusOptions) => {
      const fetchStatus = async (): Promise<ApiResponse | null> => {
        try {
          const response = await makeApiRequest(`/api/v1/scrapes/${jobId}/status`);
          
          if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
          }
          
          return await response.json() as ApiResponse;
        } catch (error) {
          console.error(chalk.red(`Error fetching status: ${formatErrorMessage(error)}`));
          return null;
        }
      };

      const displayStatus = (data: ApiResponse) => {
        if (!data) return;
        
        console.clear();
        console.log(chalk.green(`Scrape Job: ${data.job_id}`));
        console.log(chalk.blue(`Status: ${data.status}`));
        console.log(chalk.blue(`Created: ${new Date(data.created_at).toLocaleString()}`));
        console.log(chalk.blue(`Updated: ${new Date(data.updated_at).toLocaleString()}`));
        
        // Display progress if available
        if (data.progress) {
          const { percentage_complete, processed_urls, total_urls } = data.progress;
          console.log(chalk.yellow(`Progress: ${percentage_complete.toFixed(1)}% (${processed_urls}/${total_urls} URLs)`));
          
          // Create a simple progress bar
          const width = 30;
          const completed = Math.floor(width * (percentage_complete / 100));
          const bar = '█'.repeat(completed) + '░'.repeat(width - completed);
          console.log(chalk.yellow(`[${bar}]`));
        }
        
        // Display performance metrics if available
        displayPerformanceMetrics(data);
        
        // Display proposal preview if available
        if (data.proposal) {
          console.log(chalk.cyan('\nScraping Proposal:'));
          console.log(chalk.cyan('-'.repeat(50)));
          
          try {
            const proposal = data.proposal as any;
            if (proposal.proposed_approach) {
              console.log(chalk.cyan(`Approach: ${proposal.proposed_approach}`));
            }
            if (proposal.data_structure) {
              console.log(chalk.cyan(`Data Structure: ${JSON.stringify(proposal.data_structure, null, 2)}`));
            }
          } catch (error) {
            console.log(chalk.cyan(`${JSON.stringify(data.proposal, null, 2)}`));
          }
          
          console.log(chalk.cyan('-'.repeat(50)));
          console.log(chalk.gray('To approve: brain scrape approve-proposal ' + data.job_id));
        }
        
        // Display sample results if available
        if (data.sample_results && data.sample_results.length > 0) {
          console.log(chalk.magenta('\nSample Results:'));
          console.log(chalk.magenta('-'.repeat(50)));
          
          data.sample_results.slice(0, 2).forEach((sample, index) => {
            console.log(chalk.magenta(`Sample ${index + 1}:`));
            console.log(JSON.stringify(sample, null, 2));
            console.log();
          });
          
          if (data.sample_results.length > 2) {
            console.log(chalk.magenta(`... ${data.sample_results.length - 2} more samples`));
          }
          
          console.log(chalk.magenta('-'.repeat(50)));
          console.log(chalk.gray('To approve: brain scrape approve-samples ' + data.job_id));
        }
        
        // Display error if available
        if (data.error) {
          console.log(chalk.red(`\nError: ${data.error}`));
        }
      };

      // One-time check
      if (!options.watch) {
        const spinner = ora('Fetching job status...').start();
        const data = await fetchStatus();
        spinner.stop();
        
        if (data) {
          displayStatus(data);
        } else {
          console.error(chalk.red(`Could not fetch status for job ${jobId}`));
          process.exit(1);
        }
        return;
      }

      // Watch mode - poll for updates
      const interval = Number(options.interval || '5') * 1000;
      console.log(chalk.gray(`Watching for updates every ${options.interval} seconds (Ctrl+C to exit)...`));
      
      let lastStatus = '';
      
      // Initial check
      const initialData = await fetchStatus();
      if (initialData) displayStatus(initialData);
      
      // Poll for updates
      const timer = setInterval(async () => {
        const data = await fetchStatus();
        if (!data) {
          clearInterval(timer);
          return;
        }
        
        displayStatus(data);
        
        // Notify on status change
        if (data.status !== lastStatus) {
          lastStatus = data.status;
          console.log(chalk.green(`Status changed to: ${data.status}`));
          
          // Auto-exit on completed or error states
          if (['completed', 'failed', 'error'].includes(data.status.toLowerCase())) {
            console.log(chalk.gray('Job completed. Exiting watch mode.'));
            clearInterval(timer);
          }
        }
      }, interval);
    });
}
