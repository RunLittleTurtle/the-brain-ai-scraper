/**
 * Feedback Commands
 * 
 * Handles providing feedback for proposal and sample results
 */
import { Command } from 'commander';
// Define command type to avoid TypeScript issues
type CommandType = typeof Command.prototype;
import chalk from 'chalk';
import ora from 'ora';
import { ProposalFeedbackOptions, SampleFeedbackOptions, ApiResponse } from './types.js';
import { makeApiRequest, formatErrorMessage } from './utils.js';

export function registerFeedbackCommands(program: CommandType): void {
  // Register proposal feedback command
  program
    .command('approve-proposal')
    .description('Approve or reject a scrape proposal')
    .argument('<job_id>', 'ID of the scrape job')
    .option('-a, --approve', 'Approve the proposal')
    .option('-r, --reject', 'Reject the proposal')
    .option('-f, --add-fields <fields>', 'Additional fields to add (comma-separated)')
    .option('-d, --remove-fields <fields>', 'Fields to remove (comma-separated)')
    .option('-i, --instructions <text>', 'Custom instructions or modifications')
    .action(async (jobId: string, options: ProposalFeedbackOptions) => {
      // Validate options
      if ((!options.approve && !options.reject) || (options.approve && options.reject)) {
        console.error(chalk.red('Error: Must specify either --approve or --reject'));
        process.exit(1);
        return; // Ensure we don't continue with the API request
      }
      
      const spinner = ora('Submitting proposal feedback...').start();
      
      try {
        // Parse field lists
        const addFields = options.addFields ? options.addFields.split(',').map(field => field.trim()) : [];
        const removeFields = options.removeFields ? options.removeFields.split(',').map(field => field.trim()) : [];
        
        // Prepare request payload
        const payload = {
          approved: options.approve === true,
          add_fields: addFields,
          remove_fields: removeFields,
          instructions: options.instructions || ''
        };
        
        // Send request to API
        const response = await makeApiRequest(`/api/v1/scrapes/${jobId}/proposal-feedback`, 'POST', payload);
        
        // Handle response
        if (!response.ok) {
          const errorData = await response.json() as any;
          spinner.fail(chalk.red(`Error: ${errorData.message || 'Failed to submit proposal feedback'}`));
          process.exit(1);
        }
        
        const data = await response.json() as ApiResponse;
        
        if (options.approve) {
          spinner.succeed(chalk.green('Proposal approved successfully'));
          console.log(chalk.blue(`Status: ${data.status}`));
          console.log(chalk.gray(`\nTo check status: brain scrape status ${jobId}`));
        } else {
          spinner.succeed(chalk.yellow('Proposal rejected. Awaiting refinement.'));
          console.log(chalk.blue(`Status: ${data.status}`));
          console.log(chalk.gray(`\nTo check status: brain scrape status ${jobId}`));
        }
      } catch (error) {
        spinner.fail(chalk.red(`Error: ${formatErrorMessage(error)}`));
        process.exit(1);
      }
    });

  // Register sample feedback command
  program
    .command('approve-samples')
    .description('Approve or reject sample results')
    .argument('<job_id>', 'ID of the scrape job')
    .option('-a, --approve', 'Approve the sample results')
    .option('-r, --reject', 'Reject the sample results')
    .option('-f, --field-issues <issues>', 'Issues with specific fields (format: field1:issue1,field2:issue2)')
    .option('-i, --instructions <text>', 'Custom instructions for refinement')
    .action(async (jobId: string, options: SampleFeedbackOptions) => {
      // Validate options
      if ((!options.approve && !options.reject) || (options.approve && options.reject)) {
        console.error(chalk.red('Error: Must specify either --approve or --reject'));
        process.exit(1);
      }
      
      const spinner = ora('Submitting sample feedback...').start();
      
      try {
        // Parse field issues
        let fieldIssues: Record<string, string> | undefined = undefined;
        if (options.fieldIssues) {
          fieldIssues = {};
          const issuesList = options.fieldIssues.split(',');
          
          for (const issue of issuesList) {
            const [field, description] = issue.split(':').map(s => s.trim());
            if (field && description) {
              fieldIssues[field] = description;
            }
          }
        }
        
        // Prepare request payload
        const payload = {
          approved: options.approve === true,
          field_issues: fieldIssues || {},
          instructions: options.instructions || ''
        };
        
        // Send request to API
        const response = await makeApiRequest(`/api/v1/scrapes/${jobId}/sample-feedback`, 'POST', payload);
        
        // Handle response
        if (!response.ok) {
          const errorData = await response.json() as any;
          spinner.fail(chalk.red(`Error: ${errorData.message || 'Failed to submit sample feedback'}`));
          process.exit(1);
        }
        
        const data = await response.json() as ApiResponse;
        
        if (options.approve) {
          spinner.succeed(chalk.green('Sample results approved. Proceeding with full scrape.'));
          console.log(chalk.blue(`Status: ${data.status}`));
          console.log(chalk.gray(`\nTo check status: brain scrape status ${jobId}`));
        } else {
          spinner.succeed(chalk.yellow('Sample results rejected. Awaiting refinement.'));
          console.log(chalk.blue(`Status: ${data.status}`));
          console.log(chalk.gray(`\nTo check status: brain scrape status ${jobId}`));
        }
      } catch (error) {
        spinner.fail(chalk.red(`Error: ${formatErrorMessage(error)}`));
        process.exit(1);
      }
    });
}
