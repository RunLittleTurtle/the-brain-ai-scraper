import { IToolbox } from "../../core/interfaces/toolbox.interface.js"; 
import { AnalysisInput, AnalysisResult } from "./analysis.types.js";
import { UniversalConfigurationPackageFormatV1 } from "../../core/domain/configuration-package.types.js"; 
import { BuildStatus } from "../../generated/prisma/index.js"; 
import { IBuildRepository } from "../../infrastructure/db/build.repository.js";
import { OpenaiService } from "../../infrastructure/llm/openai.service.js"; 

export class AnalysisService {
    private buildRepository: IBuildRepository;
    private toolbox: IToolbox;
    private openaiService: OpenaiService;

    constructor(buildRepository: IBuildRepository, toolbox: IToolbox, openaiService: OpenaiService) {
        this.buildRepository = buildRepository;
        this.toolbox = toolbox;
        this.openaiService = openaiService;
        console.log("AnalysisService initialized");
    }

    /**
     * Analyzes the user's objective and target URLs to select initial tools and configuration.
     * This is the core function to implement the LLM interaction.
     * @param input - The analysis input data.
     * @returns The generated configuration package or null if analysis fails.
     */
    async analyzeBuildRequest(input: AnalysisInput): Promise<AnalysisResult> {
        console.log(`[AnalysisService] Starting analysis for build: ${input.buildId}`);

        try {
            // Status remains PENDING_ANALYSIS during this phase
            // await this.buildRepository.updateBuildStatus(input.buildId, BuildStatus.ANALYZING); // Removed: ANALYZING status doesn't exist

            // --- TODO: Step 1: Fetch initial content from sample URLs (if needed by LLM) ---
            // This might involve a simple fetch or using a basic scraper tool temporarily.
            // Consider rate limiting and error handling for fetching.
            console.log(`[AnalysisService] Fetching initial content for URLs (placeholder): ${input.targetUrls.join(', ')}`);
            // const sampleContent = await this.fetchSampleContent(input.targetUrls);

            // --- Step 2 & 3: Call LLM (OpenAI) via dedicated service method --- 
            console.log('[AnalysisService] Calling OpenAI service to generate initial package...');
            const generatedPackage = await this.openaiService.generateInitialPackage(
                input.userObjective,
                input.targetUrls
            );

            if (!generatedPackage) {
                 console.error('[AnalysisService] OpenAI service failed to generate package.');
                 await this.buildRepository.updateBuildStatus(input.buildId, BuildStatus.FAILED, 'LLM analysis failed: Could not generate configuration package.');
                 return { success: false, error: 'LLM analysis failed: Could not generate configuration package.', failureReason: 'llm_error' };
            }
            console.log(`[AnalysisService] Received package from OpenAI service.`);

            // --- Step 4: Parse and Validate LLM Response --- 
            // Parsing is handled within openaiService.generateInitialPackage
            // Perform secondary validation here if needed (optional)

            // Add validation logic for the parsed package structure
            const validation = this.validateGeneratedPackage(generatedPackage);
            if (!validation.isValid) {
                console.error(`[AnalysisService] Generated package failed validation: ${validation.error}`);
                await this.buildRepository.updateBuildStatus(input.buildId, BuildStatus.FAILED, `LLM analysis failed: Invalid package structure - ${validation.error}`);
                return { success: false, error: `LLM analysis failed: Invalid package structure - ${validation.error}`, failureReason: 'llm_error' };
            }
            console.log('[AnalysisService] Generated package passed validation.');
            
            console.log(`[AnalysisService] Analysis successful for build: ${input.buildId}`);
            return { success: true, package: generatedPackage };

        } catch (error) {
            console.error(`[AnalysisService] Unexpected error during analysis for build ${input.buildId}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during analysis.';
            await this.buildRepository.updateBuildStatus(input.buildId, BuildStatus.FAILED, `LLM analysis failed: ${errorMessage}`);
            return { success: false, error: `LLM analysis failed: ${errorMessage}`, failureReason: 'unknown' };
        }
    }

    /**
     * Validates the structure and content of the LLM-generated package.
     * @param response The parsed package object.
     * @returns Validation result.
     */
    private validateGeneratedPackage(response: any): { isValid: boolean; error?: string } {
        if (typeof response !== 'object' || response === null) {
            return { isValid: false, error: 'Response is not a valid object' };
        }

        if (response.schemaVersion !== '1.0') {
             return { isValid: false, error: `Invalid schemaVersion: ${response.schemaVersion}` };
        }

        if (!response.scraper || typeof response.scraper !== 'object' || !response.scraper.tool_id) {
            return { isValid: false, error: 'Missing or invalid scraper configuration' };
        }

        if (!response.expectedOutputSchema || typeof response.expectedOutputSchema !== 'object') {
             return { isValid: false, error: 'Missing or invalid expectedOutputSchema' };
        }

        // Check if tool IDs exist in the toolbox
        const validToolIds = this.toolbox.listTools().map((t: { toolId: string }) => t.toolId); // Corrected method name
        
        if (!validToolIds.includes(response.scraper.tool_id)) {
            return { isValid: false, error: `Invalid scraper toolId found: ${response.scraper.tool_id}` };
        }
        
        // Check auxiliary tools if present
        if (response.proxy && !validToolIds.includes(response.proxy.tool_id)) {
             return { isValid: false, error: `Invalid proxy toolId found: ${response.proxy.tool_id}` };
        }
        if (response.antiBlocking) {
            for (const config of response.antiBlocking) {
                if (!config || typeof config !== 'object' || !config.tool_id || !validToolIds.includes(config.tool_id)) {
                    return { isValid: false, error: `Invalid antiBlocking toolId found: ${config?.tool_id}` };
                }
            }
        }
        // Add more checks for schema, parameters etc.
        return { isValid: true };
    }
}
