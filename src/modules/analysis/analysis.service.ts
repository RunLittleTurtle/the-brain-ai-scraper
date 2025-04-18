import { IToolbox } from "../../core/interfaces/toolbox.interface.js"; 
import { AnalysisInput, AnalysisResult, RefinementInput, RefinementResult } from "./analysis.types.js";
import { UniversalConfigurationPackageFormatV1 } from "../../core/domain/configuration-package.types.js"; 
import { BuildStatus } from "../../generated/prisma/index.js"; 
import { IBuildRepository } from "../../infrastructure/db/build.repository.js";
import { OpenaiService } from "../../infrastructure/llm/openai.service.js"; 
import { UnifiedOrchestrator, ToolCallInput, OrchestrationMode } from "../../orchestrator/orchestrator.interface.js";

export class AnalysisService {
    private buildRepository: IBuildRepository;
    private toolbox: IToolbox;
    private openaiService: OpenaiService;
    private orchestrator?: UnifiedOrchestrator;

    constructor(buildRepository: IBuildRepository, toolbox: IToolbox, openaiService: OpenaiService, orchestrator?: UnifiedOrchestrator) {
        this.buildRepository = buildRepository;
        this.toolbox = toolbox;
        this.openaiService = openaiService;
        this.orchestrator = orchestrator;
        console.log("AnalysisService initialized");
    }

    /**
     * Analyzes the user's objective and target URLs to select initial tools and configuration.
     * Supports classic and MCP orchestration modes.
     * @param input - The analysis input data.
     * @returns The generated configuration package or error result.
     */
    async analyzeBuildRequest(input: AnalysisInput): Promise<AnalysisResult> {
        console.log(`[AnalysisService] Starting analysis for build: ${input.buildId}`);

        try {
            // Status remains PENDING_ANALYSIS during this phase
            // await this.buildRepository.updateBuildStatus(input.buildId, BuildStatus.ANALYZING); // Removed: ANALYZING status doesn't exist

            // Determine orchestration mode
            const mode = (process.env.TOOL_ORCHESTRATION_MODE as OrchestrationMode) || 'classic';
            if (mode === 'mcp') {
                // --- MCP Mode: Use orchestrator for tool/package selection ---
                if (!this.orchestrator) {
                    const msg = '[AnalysisService] MCP mode requested but orchestrator not provided';
                    console.error(msg);
                    await this.buildRepository.updateBuildStatus(input.buildId, BuildStatus.FAILED, msg);
                    return { success: false, error: msg, failureReason: 'llm_error' };
                }
                // TODO: Configure SECRET environment variable: MCP_API_KEY (handled in orchestrator/mcpClient)
                const toolInput: ToolCallInput = {
                    toolName: 'playwright_v1', // TODO: This should be dynamically selected or passed
                    payload: { userObjective: input.userObjective, targetUrls: input.targetUrls },
                    context: { buildId: input.buildId }
                };
                const result = await this.orchestrator.callTool(toolInput, 'mcp');
                if (result.error) {
                    console.error('[AnalysisService] MCP orchestrator error:', result.error);
                    await this.buildRepository.updateBuildStatus(input.buildId, BuildStatus.FAILED, `MCP orchestrator error: ${result.error}`);
                    return { success: false, error: `MCP orchestrator error: ${result.error}`, failureReason: 'llm_error' };
                }
                // Validate MCP output
                const validation = this.validateGeneratedPackage(result.output);
                if (!validation.isValid) {
                    console.error(`[AnalysisService] MCP output failed validation: ${validation.error}`);
                    await this.buildRepository.updateBuildStatus(input.buildId, BuildStatus.FAILED, `MCP output invalid: ${validation.error}`);
                    return { success: false, error: `MCP output invalid: ${validation.error}`, failureReason: 'llm_error' };
                }
                console.log('[AnalysisService] MCP mode: package passed validation.');
                return { success: true, package: result.output };
            }

            // --- Classic Mode (default): Use OpenAI service ---
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

    /**
     * Refines a build configuration package based on user feedback and previous samples.
     * Supports classic and MCP orchestration modes.
     * @param input - The refinement input data.
     * @returns The refined configuration package or error result.
     */
    async refineBuildConfiguration(input: RefinementInput): Promise<RefinementResult> {
        console.log(`[AnalysisService] Starting refinement for build: ${input.buildId}`);

        try {
            // Update status to reflect processing feedback
            await this.buildRepository.updateBuildStatus(input.buildId, BuildStatus.PROCESSING_FEEDBACK);

            // Determine orchestration mode
            const mode = (process.env.TOOL_ORCHESTRATION_MODE as OrchestrationMode) || 'classic';
            if (mode === 'mcp') {
                // --- MCP Mode: Use orchestrator for package refinement ---
                if (!this.orchestrator) {
                    const msg = '[AnalysisService] MCP mode requested but orchestrator not provided';
                    console.error(msg);
                    await this.buildRepository.updateBuildStatus(input.buildId, BuildStatus.FAILED, msg);
                    return { success: false, error: msg, failureReason: 'llm_error' };
                }

                const toolInput: ToolCallInput = {
                    toolName: 'refine_configuration',  // MCP tool for refinement
                    payload: {
                        originalObjective: input.originalObjective,
                        previousPackage: input.previousPackage,
                        sampleResults: input.sampleResults,
                        userFeedback: input.userFeedback,
                        toolHints: input.toolHints
                    },
                    context: { buildId: input.buildId }
                };

                console.log(`[AnalysisService] Calling MCP orchestrator for refinement...`);
                const result = await this.orchestrator.callTool(toolInput, 'mcp');
                if (result.error) {
                    console.error('[AnalysisService] MCP orchestrator error during refinement:', result.error);
                    await this.buildRepository.updateBuildStatus(input.buildId, BuildStatus.FAILED, `MCP refinement error: ${result.error}`);
                    return { success: false, error: `MCP refinement error: ${result.error}`, failureReason: 'llm_error' };
                }

                // Validate MCP output
                const validation = this.validateGeneratedPackage(result.output);
                if (!validation.isValid) {
                    console.error(`[AnalysisService] MCP refinement output failed validation: ${validation.error}`);
                    await this.buildRepository.updateBuildStatus(input.buildId, BuildStatus.FAILED, `MCP refinement output invalid: ${validation.error}`);
                    return { success: false, error: `MCP refinement output invalid: ${validation.error}`, failureReason: 'llm_error' };
                }

                console.log('[AnalysisService] MCP mode: refined package passed validation.');
                return { success: true, package: result.output };
            }

            // --- Classic Mode: Use OpenAI service ---
            console.log('[AnalysisService] Calling OpenAI service to refine package...');
            const refinedPackage = await this.openaiService.refinePackage(
                input.originalObjective,
                input.previousPackage,
                input.sampleResults,
                input.userFeedback,
                input.toolHints
            );

            if (!refinedPackage) {
                console.error('[AnalysisService] OpenAI service failed to refine package.');
                await this.buildRepository.updateBuildStatus(input.buildId, BuildStatus.FAILED, 'LLM refinement failed: Could not generate refined configuration package.');
                return { success: false, error: 'LLM refinement failed: Could not generate refined configuration package.', failureReason: 'llm_error' };
            }

            console.log(`[AnalysisService] Received refined package from OpenAI service.`);

            // Validate the refined package
            const validation = this.validateGeneratedPackage(refinedPackage);
            if (!validation.isValid) {
                console.error(`[AnalysisService] Refined package failed validation: ${validation.error}`);
                await this.buildRepository.updateBuildStatus(input.buildId, BuildStatus.FAILED, `LLM refinement failed: Invalid package structure - ${validation.error}`);
                return { success: false, error: `LLM refinement failed: Invalid package structure - ${validation.error}`, failureReason: 'llm_error' };
            }

            console.log('[AnalysisService] Refined package passed validation.');
            
            // Log if tool was switched
            if (input.previousPackage.scraper.tool_id !== refinedPackage.scraper.tool_id) {
                console.log(`[AnalysisService] Tool switched from ${input.previousPackage.scraper.tool_id} to ${refinedPackage.scraper.tool_id}`);
            }
            
            console.log(`[AnalysisService] Refinement successful for build: ${input.buildId}`);
            return { success: true, package: refinedPackage };

        } catch (error) {
            console.error(`[AnalysisService] Unexpected error during refinement for build ${input.buildId}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during refinement.';
            await this.buildRepository.updateBuildStatus(input.buildId, BuildStatus.FAILED, `LLM refinement failed: ${errorMessage}`);
            return { success: false, error: `LLM refinement failed: ${errorMessage}`, failureReason: 'unknown' };
        }
    }
}
