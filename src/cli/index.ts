#!/usr/bin/env node
/**
 * The Brain CLI
 * 
 * Terminal-based command interface for The Brain AI Scraper
 */
import { Command } from 'commander';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import fs from 'fs';
import { registerScrapeCommands } from './commands/scrape/index.js';

// Define command type to avoid TypeScript issues
type CommandType = typeof Command.prototype;

// Load environment variables
dotenv.config();

// Get package version from package.json and setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJsonPath = path.resolve(__dirname, '../../package.json');

// Check for the existence of the deprecated module without importing it
const deprecatedModulePath = path.join(__dirname, './commands/scrape.js');
if (fs.existsSync(deprecatedModulePath)) {
  console.warn(chalk.yellow('DEPRECATION WARNING: The monolithic scrape.ts module is deprecated.'));
  console.warn(chalk.yellow('Please use the new modular structure in /src/cli/commands/scrape/'));
}
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

// Create program
const program = new Command();

// Set program metadata
program
  .name('brain')
  .description('The Brain AI Scraper CLI')
  .version(packageJson.version);

// Register command groups
registerScrapeCommands(program);

// Parse command line arguments
program.parse();
