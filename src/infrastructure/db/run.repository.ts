import { PrismaClient, Run, RunStatus } from '../../generated/prisma/index.js';

export interface CreateRunData {
  buildId: string;
  targetUrls: string[];
}

export interface IRunRepository {
  createRun(data: CreateRunData): Promise<Run>;
  findRunById(id: string): Promise<Run | null>;
  updateRunStatus(id: string, status: RunStatus, error?: string): Promise<Run | null>;
}

export class RunRepository implements IRunRepository {
  constructor(private prisma: PrismaClient) {}

  async createRun(data: CreateRunData): Promise<Run> {
    try {
      const run = await this.prisma.run.create({
        data: {
          buildId: data.buildId,
          targetUrls: JSON.stringify(data.targetUrls),
          status: RunStatus.PENDING
        }
      });
      return run;
    } catch (error) {
      console.error('Error creating run:', error);
      throw new Error('Failed to create run in repository.');
    }
  }

  async findRunById(id: string): Promise<Run | null> {
    try {
      return await this.prisma.run.findUnique({ where: { id } });
    } catch (error) {
      console.error(`Error finding run by ID ${id}:`, error);
      return null;
    }
  }

  async updateRunStatus(id: string, status: RunStatus, error?: string): Promise<Run | null> {
    try {
      return await this.prisma.run.update({
        where: { id },
        data: { status, error }
      });
    } catch (error) {
      console.error(`Error updating run status for ${id}:`, error);
      return null;
    }
  }
}
