# The Brain AI Scraper CLI Documentation

This document provides a comprehensive guide to using The Brain AI Scraper CLI for interactive web scraping.

## Table of Contents

1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Command Overview](#command-overview)
4. [Scrape Commands](#scrape-commands)
    - [Creating a Scrape Job](#creating-a-scrape-job)
    - [Checking Job Status](#checking-job-status)
    - [Providing Proposal Feedback](#providing-proposal-feedback)
    - [Providing Sample Feedback](#providing-sample-feedback)
    - [Retrieving Results](#retrieving-results)
5. [Configuration Commands](#configuration-commands)
6. [MCP Orchestration Mode](#mcp-orchestration-mode)
7. [Examples](#examples)
8. [Troubleshooting](#troubleshooting)

## Installation

The Brain CLI is included with the main application. To ensure you have the latest version, run:

```bash
npm install -g @the-brain/cli
```

Alternatively, you can use the CLI directly from the project directory:

```bash
cd /path/to/the-brain
npm run cli -- [commands]
```

## Configuration

The CLI can be configured using a `.thebrainrc` file in your home directory or via environment variables.

### Configuration File

Create a `.thebrainrc` file in your home directory:

```json
{
  "apiBaseUrl": "http://localhost:3000",
  "apiKey": "your-api-key",
  "defaultFormat": "json",
  "pollingInterval": 5,
  "logLevel": "info"
}
```

### Environment Variables

Alternatively, you can use environment variables:

```bash
export API_BASE_URL="http://localhost:3000"
export API_KEY="your-api-key"
```

### Configuration Command

You can also set configuration values using the CLI:

```bash
brain config set apiBaseUrl http://localhost:3000
brain config set apiKey your-api-key
```

## Command Overview

The Brain CLI provides the following main commands:

```
Usage: brain [options] [command]

Options:
  -V, --version            output the version number
  -h, --help               display help for command

Commands:
  scrape                   Manage interactive scrape jobs
  config                   Manage CLI configuration
  help [command]           display help for command
```

## Scrape Commands

The `scrape` command group provides all functionality for managing interactive scraping jobs.

### Creating a Scrape Job

Create a new scraping job with a specified user objective and optional target URLs.

```
Usage: brain scrape create [options] <objective>

Arguments:
  objective                User objective for the scraping task

Options:
  -u, --urls <urls>        Target URLs as comma-separated string
  -m, --max-results <number>  Maximum number of results to retrieve
  -c, --context <json>     Additional context as JSON string
  -o, --orchestration-mode <mode>  Tool orchestration mode (classic, mcp, dual) (default: "default")
  -h, --help               display help for command
```

Example:
```bash
brain scrape create "Find all iPhone prices on e-commerce websites" --urls "https://example.com,https://example2.com" --orchestration-mode mcp
```

### Checking Job Status

Check the status of an existing scrape job, with optional watch mode for real-time updates.

```
Usage: brain scrape status [options] <job_id>

Arguments:
  job_id                   ID of the scrape job

Options:
  -w, --watch              Watch mode - polls for updates
  -i, --interval <seconds> Polling interval in seconds (default: "5")
  -h, --help               display help for command
```

Example:
```bash
brain scrape status abc123-456-789 --watch
```

### Providing Proposal Feedback

Approve or reject a scraping proposal with optional modifications.

```
Usage: brain scrape approve-proposal [options] <job_id>

Arguments:
  job_id                   ID of the scrape job

Options:
  -a, --approve            Approve the proposal
  -r, --reject             Reject the proposal
  -f, --add-fields <fields>  Additional fields to add (comma-separated)
  -d, --remove-fields <fields>  Fields to remove (comma-separated)
  -i, --instructions <text>  Custom instructions or modifications
  -h, --help               display help for command
```

Example:
```bash
brain scrape approve-proposal abc123-456-789 --approve --add-fields "discount,rating"
```

### Providing Sample Feedback

Approve or reject sample results with optional feedback on specific fields.

```
Usage: brain scrape approve-samples [options] <job_id>

Arguments:
  job_id                   ID of the scrape job

Options:
  -a, --approve            Approve the sample results
  -r, --reject             Reject the sample results
  -f, --field-issues <issues>  Issues with specific fields (format: field1:issue1,field2:issue2)
  -i, --instructions <text>  Custom instructions for refinement
  -h, --help               display help for command
```

Example:
```bash
brain scrape approve-samples abc123-456-789 --reject --field-issues "price:Missing currency,description:Too short" --instructions "Please ensure all prices include currency symbols"
```

### Retrieving Results

Retrieve and optionally export results from a completed scrape job.

```
Usage: brain scrape results [options] <job_id>

Arguments:
  job_id                   ID of the scrape job

Options:
  -f, --format <format>    Output format (json or csv) (default: "json")
  -o, --output <file>      Output file path
  -h, --help               display help for command
```

Example:
```bash
brain scrape results abc123-456-789 --format csv --output ./scrape-results.csv
```

## Configuration Commands

The `config` command group provides functionality for managing CLI configuration.

```
Usage: brain config [command]

Commands:
  set                      Set configuration value
  get                      Get configuration value
  list                     List all configuration values
  help [command]           display help for command
```

Example:
```bash
brain config set apiKey my-new-api-key
brain config list
```

## MCP Orchestration Mode

The Brain CLI supports the Model Context Protocol (MCP) for tool orchestration with three modes:

1. **classic** - Uses direct function calls for tool invocation
2. **mcp** - Uses the MCP protocol for tool invocation
3. **dual** - Uses both classic and MCP modes in parallel for comparison

You can specify the orchestration mode when creating a scrape job:

```bash
brain scrape create "Find product information" --orchestration-mode dual
```

In dual mode, the CLI will display performance metrics comparing the classic and MCP approaches.

## Examples

### Complete Scraping Workflow

```bash
# Step 1: Create a scrape job
brain scrape create "Extract product prices from Amazon" --urls "https://amazon.com/s?k=laptops"

# Step 2: Check status and wait for proposal
brain scrape status abc123-456-789 --watch

# Step 3: Approve the proposal with modifications
brain scrape approve-proposal abc123-456-789 --approve --add-fields "discount,rating"

# Step 4: Check status again to monitor progress
brain scrape status abc123-456-789 --watch

# Step 5: Provide feedback on sample results
brain scrape approve-samples abc123-456-789 --approve

# Step 6: Wait for job completion
brain scrape status abc123-456-789 --watch

# Step 7: Retrieve and export results
brain scrape results abc123-456-789 --format csv --output laptop-prices.csv
```

## Troubleshooting

### API Connection Issues

If you're experiencing connection issues:

1. Verify your API base URL: `brain config get apiBaseUrl`
2. Check your API key: `brain config get apiKey`
3. Ensure the API server is running
4. Check for any network restrictions

### Command Errors

If a command fails:

1. Check the error message for details
2. Verify the job ID is correct
3. Ensure you're using the correct command syntax
4. Check the job status to see if it's in the expected state

### Debug Mode

Enable debug logging for more detailed output:

```bash
brain config set logLevel debug
```

### Getting Help

For more help on any command, use the `--help` flag:

```bash
brain --help
brain scrape --help
brain scrape create --help
```
