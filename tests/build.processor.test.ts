import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { PrismaClient, BuildStatus, Build } from '../src/generated/prisma/index.js'; // Import Prisma types
import { UniversalConfigurationPackageFormatV1 } from '../src/core/domain/configuration-package.types.js';
import { ExecutionEngineService, ExecutionResult } from '../src/infrastructure/execution/execution.service.js'; // Use class directly
import { BuildRepository, IBuildRepository } from '../src/infrastructure/db/build.repository.js'; // Import Repository
import { ToolboxService } from '../src/infrastructure/toolbox/toolbox.service.js'; // Import ToolboxService
// Import Analysis Service and Types
import { AnalysisService } from '../src/modules/analysis/analysis.service.js';
import { AnalysisInput, AnalysisResult } from '../src/modules/analysis/analysis.types.js';

// --- Define Signatures for Mocked Methods ---
// type FindBuildByIdFn = (id: string) => Promise<Build | null>;
// type UpdateBuildStatusFn = (id: string, status: BuildStatus, error?: string) => Promise<Build | null>;
// type UpdateTempPackageFn = (id: string, pkg: UniversalConfigurationPackageFormatV1) => Promise<Build | null>;
// type UpdateSampleResultsFn = (id: string, results: ExecutionResult) => Promise<Build | null>;
// type AnalyzeBuildRequestFn = (input: AnalysisInput) => Promise<AnalysisResult>;
// type ExecutePackageFn = (configPackage: UniversalConfigurationPackageFormatV1, targetUrls: string[]) => Promise<ExecutionResult>;

// --- Mock Service Instances (Reverted to simple objects with casting) ---
const mockBuildRepositoryInstance = {
    findBuildById: vi.fn(),
    updateBuildStatus: vi.fn(),
    updateTempPackage: vi.fn(),
    updateSampleResults: vi.fn(),
    // We still need other methods from IBuildRepository to satisfy the type, even if not used in tests
    createBuild: vi.fn(),
    updateFinalConfiguration: vi.fn(),
} as unknown as IBuildRepository;

const mockAnalysisInstance = {
    analyzeBuildRequest: vi.fn(),
    // Add other AnalysisService methods/properties if needed for type compatibility
} as unknown as AnalysisService;

const mockExecutionEngineInstance = {
    executePackage: vi.fn(),
    cleanupTools: vi.fn(),
    // Add missing properties required by Mocked<ExecutionEngineService>
    // toolbox: vi.fn(), // Removed - properties not needed for basic object mock
    // instantiatedTools: new Map(),
} as unknown as ExecutionEngineService;

const mockToolboxInstance = {
    getTool: vi.fn(),
    registerTool: vi.fn(),
    listTools: vi.fn(),
    registerDefaultTools: vi.fn(),
    // Add missing properties required by Mocked<ToolboxService>
    // tools: new Map(),
    // logger: { ... },
} as unknown as ToolboxService;

// Dynamically imported processBuildJob function
let processBuildJob: (
  jobId: string, 
  buildId: string,
  buildRepository: IBuildRepository,
  analysisService: AnalysisService, 
  executionEngine: ExecutionEngineService 
) => Promise<void>;

// Mock Execution Result (Success)
const mockExecutionResult: ExecutionResult = {
  overallStatus: 'completed',
  results: ['http://example.com', 'http://example.org'].map(url => ({ url, data: { title: 'Mock Title' }, status: 'success', success: true, error: undefined })),
};

// Mock Build Object (Default: PENDING_ANALYSIS)
const mockBuild: Build & { targetUrlsList: string[] } = {
  id: 'test-build-id',
  userId: null,
  userObjective: 'Get titles',
  targetUrls: JSON.stringify(['http://example.com', 'http://example.org']),
  targetUrlsList: ['http://example.com', 'http://example.org'],
  status: BuildStatus.PENDING_ANALYSIS,
  error: null, 
 
  initialPackageJson: null,
  sampleResultsJson: null, 
  finalConfigurationJson: null, 
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Mock Analysis Result (Success)
const mockAnalysisResultSuccess: AnalysisResult = {
    success: true,
    package: {
      schemaVersion: '1.0', 
      description: 'Mock analysis result package', 
      scraper: {
        tool_id: 'scraper:fetch_cheerio_v1', 
        parameters: {
          selectors: { title: 'h1', description: '.desc' }, 
          // Add other necessary scraper parameters here
        },
        // Ensure ScraperToolConfiguration specific fields are present if needed
      },
      expectedOutputSchema: { 
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' }
        },
        required: ['title']
      }
    },
};


