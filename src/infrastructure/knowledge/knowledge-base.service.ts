/**
 * Knowledge Base Service
 * 
 * Provides methods for searching and retrieving data from the knowledge base
 * to support intelligent tool selection and configuration.
 */

import { PrismaClient, Build } from '../../generated/prisma/index.js';

export interface SimilarBuildResult {
  id: string;
  similarity: number;
  userObjective: string;
  finalPackageJson?: any;
  targetUrls: string[];
}

/**
 * Service for interacting with the knowledge base of past builds
 */
export class KnowledgeBaseService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Find similar builds to the given objective and target URLs
   * 
   * @param userObjective The user's objective for the scrape
   * @param targetUrls Array of target URLs
   * @param limit Maximum number of similar builds to return
   * @returns Array of similar builds with similarity score
   */
  async findSimilarBuilds(
    userObjective: string, 
    targetUrls: string[], 
    limit: number = 5
  ): Promise<SimilarBuildResult[]> {
    // Get completed builds that have a final configuration
    const completedBuilds = await this.prisma.build.findMany({
      where: {
        status: 'COMPLETED',
        finalPackageJson: {
          not: null
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Get a reasonable number to analyze
    });

    if (completedBuilds.length === 0) {
      return [];
    }

    // Extract the domain from target URLs
    const domains = targetUrls.map(url => {
      try {
        const urlObj = new URL(url);
        return urlObj.hostname;
      } catch (e) {
        return '';
      }
    });

    // Simple similarity scoring - this would be replaced with more sophisticated
    // vector similarity or embeddings-based search in a production system
    const scoredBuilds = completedBuilds.map(build => {
      let similarity = 0;
      
      // Text similarity for user objective (very simple)
      const buildObjective = build.userObjective.toLowerCase();
      const currentObjective = userObjective.toLowerCase();
      
      // Check for word overlap
      const buildWords = buildObjective.split(/\s+/);
      const currentWords = currentObjective.split(/\s+/);
      
      const commonWords = buildWords.filter(word => 
        currentWords.includes(word) && word.length > 3
      );
      
      similarity += (commonWords.length / Math.max(buildWords.length, currentWords.length)) * 50;
      
      // Domain similarity
      if (build.targetUrlsList && build.targetUrlsList.length > 0) {
        const buildDomains = (build.targetUrlsList as string[]).map(url => {
          try {
            const urlObj = new URL(url);
            return urlObj.hostname;
          } catch (e) {
            return '';
          }
        });
        
        const commonDomains = buildDomains.filter(domain => 
          domains.includes(domain) && domain
        );
        
        similarity += (commonDomains.length / Math.max(buildDomains.length, domains.length)) * 50;
      }
      
      return {
        id: build.id,
        similarity,
        userObjective: build.userObjective,
        finalPackageJson: build.finalPackageJson ? JSON.parse(build.finalPackageJson as string) : undefined,
        targetUrls: build.targetUrlsList || []
      };
    });
    
    // Sort by similarity (highest first) and take the top 'limit'
    return scoredBuilds
      .sort((a, b) => b.similarity - a.similarity)
      .filter(build => build.similarity > 10) // Only return builds with reasonable similarity
      .slice(0, limit);
  }

  /**
   * Get the optimal configuration package based on past builds
   * 
   * @param userObjective The user's objective for the scrape
   * @param targetUrls Array of target URLs
   * @returns The most relevant configuration package, or undefined if none found
   */
  async getOptimalConfiguration(
    userObjective: string,
    targetUrls: string[]
  ): Promise<any | undefined> {
    const similarBuilds = await this.findSimilarBuilds(userObjective, targetUrls, 1);
    
    if (similarBuilds.length > 0 && similarBuilds[0].finalPackageJson) {
      return similarBuilds[0].finalPackageJson;
    }
    
    return undefined;
  }
}
