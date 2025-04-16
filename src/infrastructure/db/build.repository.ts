import { PrismaClient, Build, BuildStatus } from '../../generated/prisma/index.js';
import { UniversalConfigurationPackageFormatV1 } from '../../core/domain/configuration-package.types';
import { ExecutionResult } from '../execution/execution.service.js'; // Assuming this path

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
  updateTempPackage(id: string, pkg: UniversalConfigurationPackageFormatV1): Promise<Build | null>;
  updateSampleResults(id: string, results: ExecutionResult): Promise<Build | null>;
  updateFinalConfiguration(id: string, pkg: UniversalConfigurationPackageFormatV1): Promise<Build | null>;
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
      throw new Error('Failed to find build by ID in repository.');
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

  async updateTempPackage(id: string, pkg: UniversalConfigurationPackageFormatV1): Promise<Build | null> {
    try {
      const packageJson = JSON.stringify(pkg);
      const build = await this.prisma.build.update({
        where: { id },
        data: { /* TODO: Add valid properties here. Removed tempPackageJson as it is not in the Prisma schema. */ },
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
      const packageJson = JSON.stringify(pkg);
      const build = await this.prisma.build.update({
        where: { id },
        data: {
            finalConfigurationJson: packageJson,
            status: BuildStatus.CONFIRMED // Typically set status when confirming
        },
      });
      return build;
    } catch (error) {
      console.error(`Error updating final configuration for build ${id}:`, error);
      return null; // Or throw
    }
  }
}

// Potential: Export a singleton instance if not using DI
// export const buildRepository = new BuildRepository(new PrismaClient()); // Requires direct client instantiation
