import { PrismaClient, Build, BuildStatus } from '../../generated/prisma/index.js';
import { UniversalConfigurationPackageFormatV1 } from '../../core/domain/configuration-package.types.js';
import { ExecutionResult } from '../execution/execution.service.js'; // Assuming this path
import { ErrorDetails } from '../../core/domain/error-reporting.types.js'; // Import error reporting types

// Interface for data required to create a build
export interface CreateBuildData {
  targetUrls: string[];
  userObjective: string;
  userId?: string; // Optional user association
}

// Interface for the repository methods
export interface IBuildRepository {
  createBuild(data: CreateBuildData): Promise<Build>;
  findBuildById(id: string): Promise<(Build & { targetUrlsList?: string[] }) | null>; // Add deserialized URLs
  updateBuildStatus(id: string, status: BuildStatus, error?: string): Promise<Build | null>;
  updateBuildError(id: string, errorDetails: ErrorDetails): Promise<Build | null>; // Add structured error details
  updateTempPackage(id: string, pkg: UniversalConfigurationPackageFormatV1): Promise<Build | null>;
  updateSampleResults(id: string, results: ExecutionResult): Promise<Build | null>;
  updateFinalConfiguration(id: string, pkg: UniversalConfigurationPackageFormatV1): Promise<Build | null>;
  updateUserFeedback(id: string, feedback: string): Promise<Build | null>;
}

export class BuildRepository implements IBuildRepository {
  // Prisma client is expected to be injected or passed in
  constructor(private prisma: PrismaClient) {}

  async createBuild(data: CreateBuildData): Promise<Build> {
    try {
      // Serialize targetUrls to JSON string for SQLite compatibility
      const targetUrlsJson = JSON.stringify(data.targetUrls);

      const build = await this.prisma.build.create({
        data: {
          userObjective: data.userObjective,
          targetUrls: targetUrlsJson, // Store as JSON string
          userId: data.userId,
          status: BuildStatus.PENDING_ANALYSIS, // Initial status
        },
      });
      return build;
    } catch (error) {
      console.error('Error creating build:', error);
      // Consider throwing a more specific custom error
      throw new Error('Failed to create build in repository.');
    }
  }

  async findBuildById(id: string): Promise<(Build & { targetUrlsList?: string[] }) | null> {
    try {
      const build = await this.prisma.build.findUnique({
        where: { id },
      });

      if (build) {
        // Deserialize targetUrls
        let targetUrlsList: string[] | undefined;
        try {
          targetUrlsList = JSON.parse(build.targetUrls);
        } catch (parseError) {
          console.error(`Failed to parse targetUrls for build ${id}:`, parseError);
          // Handle cases where parsing fails (e.g., corrupted data)
          targetUrlsList = undefined;
        }
        return { ...build, targetUrlsList };
      }
      return null;
    } catch (error) {
      console.error(`Error finding build by ID ${id}:`, error);
      // Instead of throwing, return null so the handler can send 404 or validation errors, not 500
      return null;
    }
  }

  async updateBuildStatus(id: string, status: BuildStatus, error?: string): Promise<Build | null> {
    try {
      const build = await this.prisma.build.update({
        where: { id },
        data: {
          status,
          error: error ?? null, // Ensure error is null if not provided
        },
      });
      return build;
    } catch (error) {
      console.error(`Error updating status for build ${id}:`, error);
      // Handle specific Prisma errors like P2025 (Record not found) if needed
      return null; // Or throw
    }
  }

  /**
   * Updates the build with detailed error information
   * 
   * @param id - Build ID
   * @param errorDetails - Structured error details
   * @returns The updated Build or null if update fails
   */
  async updateBuildError(id: string, errorDetails: ErrorDetails): Promise<Build | null> {
    try {
      // Store the simpler error message in the legacy field for backward compatibility
      const errorMessage = errorDetails.message;
      
      // Convert ErrorDetails to a plain object with index signature for Prisma JSON compatibility
      const errorDetailsObject: Record<string, any> = {
        message: errorDetails.message,
        category: errorDetails.category,
        severity: errorDetails.severity,
        timestamp: errorDetails.timestamp,
      };
      
      // Add optional fields
      if (errorDetails.type) errorDetailsObject.type = errorDetails.type;
      if (errorDetails.code) errorDetailsObject.code = errorDetails.code;
      if (errorDetails.stack) errorDetailsObject.stack = errorDetails.stack;
      if (errorDetails.context) errorDetailsObject.context = errorDetails.context;
      if (errorDetails.metadata) errorDetailsObject.metadata = errorDetails.metadata;
      
      const build = await this.prisma.build.update({
        where: { id },
        data: {
          error: errorMessage,
          errorDetailsJson: errorDetailsObject, // Store as compatible object
          status: BuildStatus.FAILED,
        },
      });
      
      return build;
    } catch (error) {
      console.error(`Error updating error details for build ${id}:`, error);
      return null;
    }
  }

  async updateTempPackage(id: string, pkg: UniversalConfigurationPackageFormatV1): Promise<Build | null> {
    try {
      // Convert to plain object if needed
      const packageObject: Record<string, any> = { ...pkg };
      
      const build = await this.prisma.build.update({
        where: { id },
        data: { initialPackageJson: packageObject }, // Use initialPackageJson from the schema
      });
      return build;
    } catch (error) {
      console.error(`Error updating temporary package for build ${id}:`, error);
      return null; // Or throw
    }
  }

  async updateSampleResults(id: string, results: ExecutionResult): Promise<Build | null> {
    try {
      const resultsJson = JSON.stringify(results);
      const build = await this.prisma.build.update({
        where: { id },
        data: { sampleResultsJson: resultsJson },
      });
      return build;
    } catch (error) {
      console.error(`Error updating sample results for build ${id}:`, error);
      return null; // Or throw
    }
  }

   async updateFinalConfiguration(id: string, pkg: UniversalConfigurationPackageFormatV1): Promise<Build | null> {
    try {
      // Convert to plain object if needed
      const packageObject: Record<string, any> = { ...pkg };
      
      const build = await this.prisma.build.update({
        where: { id },
        data: { finalPackageJson: packageObject, status: BuildStatus.CONFIRMED }, // Use finalPackageJson instead of finalConfigurationJson
      });
      return build;
    } catch (error) {
      console.error(`Error updating final configuration for build ${id}:`, error);
      return null; // Or throw
    }
  }
  
  /**
   * Updates the user feedback for a build
   * 
   * @param id - Build ID
   * @param feedback - User feedback as JSON string
   * @returns The updated Build or null if update fails
   */
  async updateUserFeedback(id: string, feedback: string): Promise<Build | null> {
    try {
      const build = await this.prisma.build.update({
        where: { id },
        data: { userFeedbackJson: feedback }
      });
      return build;
    } catch (error) {
      console.error(`Error updating user feedback for build ${id}:`, error);
      return null;
    }
  }
}

// Potential: Export a singleton instance if not using DI
// export const buildRepository = new BuildRepository(new PrismaClient()); // Requires direct client instantiation
