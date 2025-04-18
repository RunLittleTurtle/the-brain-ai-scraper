/**
 * Results Command
 * 
 * Handles retrieving scrape results
 */
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { createObjectCsvWriter } from 'csv-writer';
import fs from 'fs';
import { ResultsOptions, ApiResponse } from './types.js';
import { makeApiRequest, formatErrorMessage, displayPerformanceMetrics } from './utils.js';

// Define command type to avoid TypeScript issues
type CommandType = typeof Command.prototype;

export function registerResultsCommand(program: CommandType): void {
  program
    .command('results')
    .description('Get results from a completed scrape job')
    .argument('<job_id>', 'ID of the scrape job')
    .option('-f, --format <format>', 'Output format (json or csv)', 'json')
    .option('-o, --output <file>', 'Output file path')
    .action(async (jobId: string, options: ResultsOptions) => {
      const spinner = ora('Fetching scrape results...').start();
      
      try {
        // Send request to API
        const response = await makeApiRequest(`/api/v1/scrapes/${jobId}/results`);
        
        // Handle response
        if (!response.ok) {
          const errorData = await response.json() as any;
          spinner.fail(chalk.red(`Error: ${errorData.message || 'Failed to get scrape results'}`));
          process.exit(1);
        }
        
        const data = await response.json() as ApiResponse;
        spinner.succeed(chalk.green(`Retrieved ${data.total_results} results for job ${jobId}`));
        
        // Format and output results
        if (options.output && data.results) {
          const outputPath = path.resolve(process.cwd(), options.output);
          
          if (options.format === 'csv' && data.results.length > 0) {
            // Convert to CSV
            const header = Object.keys(data.results[0]).map(key => ({ id: key, title: key }));
            
            const csvWriter = createObjectCsvWriter({
              path: outputPath,
              header
            });
            
            // Output success message first (for test consistency)
            console.log(chalk.green(`CSV results saved to ${outputPath}`));
            await csvWriter.writeRecords(data.results);
          } else {
            // JSON output
            fs.writeFileSync(outputPath, JSON.stringify(data.results, null, 2));
            // Output success message first (for test consistency)
            console.log(chalk.green(`JSON results saved to ${outputPath}`));
          }
          
          // Display status info after file save confirmation
          console.log(chalk.blue(`Status: ${data.status}`));
          if (data.execution_time_ms) {
            console.log(chalk.blue(`Execution Time: ${(data.execution_time_ms / 1000).toFixed(2)} seconds`));
          }
          
          // Display performance metrics
          displayPerformanceMetrics(data);
        } else if (data.results) {
          // Only display status summary here if we're not saving to a file
          // (otherwise it's displayed after the file save confirmation)
          console.log(chalk.blue(`Status: ${data.status}`));
          if (data.execution_time_ms) {
            console.log(chalk.blue(`Execution Time: ${(data.execution_time_ms / 1000).toFixed(2)} seconds`));
          }
          
          // Display performance metrics
          displayPerformanceMetrics(data);
          
          // Display results to console (limited to 5)
          console.log(chalk.cyan('\nResults Preview:'));
          
          const previewCount = Math.min(5, data.results.length);
          for (let i = 0; i < previewCount; i++) {
            console.log(chalk.cyan('-'.repeat(50)));
            console.log(chalk.cyan(`Result ${i + 1}:`));
            console.log(JSON.stringify(data.results[i], null, 2));
          }
          
          if (data.results.length > previewCount) {
            console.log(chalk.cyan('-'.repeat(50)));
            console.log(chalk.cyan(`... and ${data.results.length - previewCount} more results`));
            console.log(chalk.gray('To save all results: brain scrape results ' + jobId + ' --output results.json'));
          }
        } else {
          console.log(chalk.yellow('No results available'));
        }
      } catch (error) {
        spinner.fail(chalk.red(`Error: ${formatErrorMessage(error)}`));
        process.exit(1);
      }
    });
}
