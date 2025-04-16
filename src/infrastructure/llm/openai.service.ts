import OpenAI from 'openai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UniversalConfigurationPackageFormatV1, ScraperToolConfiguration, ToolId } from '../../core/domain/configuration-package.types';
import { ToolboxService } from '../toolbox/toolbox.service';
import { ITool } from '../execution/tool.interface';

@Injectable()
export class OpenaiService {
  private readonly logger = new Logger(OpenaiService.name);
  private openai: OpenAI | null = null;

  constructor(
    private configService: ConfigService,
    private toolboxService: ToolboxService
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not found in environment variables. LLM features will be disabled.');
    } else {
      this.openai = new OpenAI({ apiKey });
    }
  }

  /**
   * Generates an initial scraper configuration package using OpenAI.
   * @param objective The user's objective for scraping.
   * @param sampleUrls A few sample URLs to analyze.
   * @returns A Promise resolving to the generated configuration package or null if generation fails.
   */
  async generateInitialPackage(
    objective: string,
    sampleUrls: string[],
  ): Promise<UniversalConfigurationPackageFormatV1 | null> {
    if (!this.openai) {
      this.logger.error('OpenAI client not initialized. Cannot generate package.');
      return null;
    }

    const availableScrapers = this.toolboxService.listTools()
        .filter((tool: ITool) => tool.toolId.startsWith('scraper:'));
    const scraperDescriptions = availableScrapers.map((s: ITool) => `  - ${s.toolId}: ${s.description}`).join('\n');

    // Basic prompt engineering - needs significant refinement for production
    const prompt = `
Objective: ${objective}
Sample URLs: ${sampleUrls.join(', ')}

Available Scraper Tools:
${scraperDescriptions}

Based on the objective and sample URLs, determine the best scraper tool ID from the list above and generate a JSON configuration package in the following format. ONLY return the JSON object, nothing else.

Example Format:
{
  "version": "1.0",
  "objective": "Extract job titles and company names",
  "targetUrls": [], // Keep this empty, it will be populated later
  "scraper": {
    "toolId": "scraper:playwright_stealth_v1", // Choose the best tool ID from the list
    "selectors": {
      "field1": "css_selector_for_field1",
      "field2": "css_selector_for_field2"
      // ... add more fields based on objective
    }
    // Add other tool-specific configurations if needed (e.g., waitTimes, interactionSteps)
  },
  "postProcessing": [],
  "delivery": {}
}

Determine the necessary data fields from the objective and create appropriate CSS selectors (be specific and robust if possible, guess if unsure).

Your Response (JSON only):
`;

    const modelId = this.configService.get<string>('OPENAI_MODEL_ID', 'gpt-3.5-turbo'); // Read model ID, default to gpt-3.5-turbo

    try {
      this.logger.debug(`Sending prompt to OpenAI for initial package generation...`);
      const response = await this.openai.chat.completions.create({
        model: modelId, // Use the configured model ID
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2, // Low temperature for more deterministic JSON output
        // max_tokens: 500, // Consider setting limits
      });

      const rawResponse = response.choices[0]?.message?.content;
      if (!rawResponse) {
        throw new Error('Empty response from OpenAI');
      }

      this.logger.debug(`Received raw response: ${rawResponse}`);

      // Attempt to parse the response as JSON
      // Basic cleanup: remove potential markdown fences or leading/trailing text
      const jsonString = rawResponse.trim().replace(/^```json\n?|```$/g, '');
      const generatedPackage = JSON.parse(jsonString) as UniversalConfigurationPackageFormatV1;

      // Basic validation (can be expanded significantly)
      if (!generatedPackage.version || !generatedPackage.scraper?.toolId || !generatedPackage.scraper?.selectors) {
        throw new Error('Generated package is missing required fields.');
      }
      // Ensure the selected tool is one we listed
      if (!availableScrapers.some((s: ITool) => s.toolId === generatedPackage.scraper.toolId)) {
         this.logger.warn(`LLM selected a tool not in the provided list: ${generatedPackage.scraper.toolId}. Attempting to proceed.`);
         // Decide how to handle - maybe default to a known good tool or fail?
         // For now, we log a warning and let it pass.
      }

      this.logger.log(`Successfully generated initial package using tool: ${generatedPackage.scraper.toolId}`);

       // Fill in objective and potentially sample URLs if needed for context, leave targetUrls empty
      generatedPackage.objective = objective;
      // generatedPackage.targetUrls = sampleUrls; // Decide if sample URLs should be part of the final initial package
      generatedPackage.targetUrls = [];

      return generatedPackage;

    } catch (error) {
      this.logger.error('Error generating initial package from OpenAI:', error);
      if (error instanceof SyntaxError) {
        this.logger.error('Failed to parse OpenAI response as JSON.');
      }
      return null;
    }
  }
}
