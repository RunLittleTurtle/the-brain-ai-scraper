/**
 * CLI Configuration Module
 * 
 * Manages configuration settings for The Brain CLI
 */
import os from 'os';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Default configuration values
const DEFAULT_CONFIG = {
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  apiKey: process.env.API_KEY || '',
  defaultFormat: 'json',
  pollingInterval: 5,
  logLevel: 'info'
};

// Configuration file path
const CONFIG_FILE_NAME = '.thebrainrc';
const CONFIG_FILE_PATH = path.join(os.homedir(), CONFIG_FILE_NAME);

// Configuration interface
interface BrainConfig {
  apiBaseUrl: string;
  apiKey: string;
  defaultFormat: string;
  pollingInterval: number;
  logLevel: string;
}

/**
 * Get configuration from file or environment
 */
export function getConfig(): BrainConfig {
  try {
    // Check if config file exists
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const fileConfig = JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, 'utf8'));
      return { ...DEFAULT_CONFIG, ...fileConfig };
    }
  } catch (error) {
    console.warn(`Warning: Could not read config file ${CONFIG_FILE_PATH}`);
  }

  // Return default config
  return DEFAULT_CONFIG;
}

/**
 * Save configuration to file
 */
export function saveConfig(config: Partial<BrainConfig>): void {
  try {
    // Merge with existing config
    const existingConfig = fs.existsSync(CONFIG_FILE_PATH)
      ? JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, 'utf8'))
      : {};
    
    const newConfig = { ...existingConfig, ...config };
    
    // Write config to file
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(newConfig, null, 2));
    console.log(`Configuration saved to ${CONFIG_FILE_PATH}`);
  } catch (error) {
    console.error(`Error saving config: ${error}`);
  }
}

/**
 * Initialize configuration with CLI command
 */
export function initializeConfigCommand(program: any): void {
  const configCommand = program
    .command('config')
    .description('Manage CLI configuration');
  
  // Set configuration value
  configCommand
    .command('set')
    .description('Set configuration value')
    .argument('<key>', 'Configuration key (apiBaseUrl, apiKey, defaultFormat, pollingInterval, logLevel)')
    .argument('<value>', 'Configuration value')
    .action((key: string, value: string) => {
      if (!Object.keys(DEFAULT_CONFIG).includes(key)) {
        console.error(`Error: Unknown configuration key "${key}"`);
        process.exit(1);
      }
      
      // Parse value based on key type
      let parsedValue: any = value;
      if (key === 'pollingInterval') {
        parsedValue = parseInt(value, 10);
        if (isNaN(parsedValue)) {
          console.error('Error: polling interval must be a number');
          process.exit(1);
        }
      }
      
      // Update config
      saveConfig({ [key]: parsedValue } as Partial<BrainConfig>);
    });
  
  // Get configuration value
  configCommand
    .command('get')
    .description('Get configuration value')
    .argument('[key]', 'Configuration key (omit to get all)')
    .action((key?: string) => {
      const config = getConfig();
      
      if (key) {
        if (!Object.keys(DEFAULT_CONFIG).includes(key)) {
          console.error(`Error: Unknown configuration key "${key}"`);
          process.exit(1);
        }
        
        console.log(`${key}: ${(config as any)[key]}`);
      } else {
        // Show all config
        console.log(JSON.stringify(config, null, 2));
      }
    });
  
  // Reset configuration
  configCommand
    .command('reset')
    .description('Reset configuration to defaults')
    .action(() => {
      if (fs.existsSync(CONFIG_FILE_PATH)) {
        fs.unlinkSync(CONFIG_FILE_PATH);
        console.log('Configuration reset to defaults');
      } else {
        console.log('No configuration file found. Using defaults.');
      }
    });
}
