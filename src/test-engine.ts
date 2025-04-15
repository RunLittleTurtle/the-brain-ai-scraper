import { ExecutionEngineService, ExecutionResult } from './infrastructure/execution/execution.service.js';
import { UniversalConfigurationPackageFormatV1, ScraperToolConfiguration } from './core/domain/configuration-package.types.js';
import { toolboxService } from './infrastructure/toolbox/toolbox.service.js'; 

// --- Sample Configuration Package ---
const sampleScraperConfig: ScraperToolConfiguration = {
  tool_id: 'scraper:playwright_stealth_v1', 
  parameters: {
    selectors: {
      quote_text: '.quote .text', 
      author: '.quote .author', 
    },
    attribute: 'text', 
    timeout_ms: 20000, 
    // Optional: Add wait_selector if needed, e.g., wait_selector: '.quote'
    // wait_selector: '.quote',
  },
};

const sampleConfig: UniversalConfigurationPackageFormatV1 = {
  schemaVersion: '1.0',
  description: 'Test scraping quotes from quotes.toscrape.com/js using Playwright', 
  scraper: sampleScraperConfig, 
  // No auxiliary tools for this simple test
};

// --- Target URL(s) ---
const targetUrls = [
  'https://quotes.toscrape.com/js/', 
  // Add more URLs here if needed
];

// --- Execution ---
async function runTest() {
  console.log('--- Starting Test Execution ---');
  console.log('Using Tool:', sampleConfig.scraper.tool_id);
  console.log('Target URL(s):', targetUrls);
  console.log('Selectors:', sampleConfig.scraper.parameters.selectors);


  // Instantiate the engine (or import a singleton instance if you set one up)
  const executionEngine = new ExecutionEngineService(toolboxService); 

  try {
    // IMPORTANT: Ensure Playwright browsers are installed!
    // You might need to run `npx playwright install` once if you haven't.
    console.log('\n[Test Engine] Executing package...');
    const result: ExecutionResult = await executionEngine.executePackage(sampleConfig, targetUrls);

    console.log('\n--- Execution Result ---');
    console.log('Overall Status:', result.overallStatus);

    if (result.error) {
      console.error('Execution Engine Error:', result.error);
    }

    console.log('\nResults per URL:');
    result.results.forEach((res, index) => {
      console.log(`\nURL ${index + 1}: ${targetUrls[index]}`);
      if (res.success) {
        console.log('  Status: Success');
        // Only show first few results if data is an array (Playwright likely returns one object per page)
        const dataToShow = Array.isArray(res.data) ? res.data.slice(0, 3) : res.data;
        console.log('  Data:', JSON.stringify(dataToShow, null, 2));
        if (Array.isArray(res.data) && res.data.length > 3) {
            console.log('  ... (data truncated)');
        }
      } else {
        console.log('  Status: Failed');
        console.log('  Error:', res.error);
      }
      if (res.metadata) {
        console.log('  Metadata:', JSON.stringify(res.metadata, null, 2));
      }
    });

  } catch (error) {
    console.error('\n--- Unhandled Exception during Execution ---');
    console.error(error);
  } finally {
    // Important: Ensure graceful cleanup of tools (like closing Playwright)
    await executionEngine.cleanupTools();
    console.log('\n--- Test Execution Finished ---');
  }
}

// --- Run the test ---
runTest();
