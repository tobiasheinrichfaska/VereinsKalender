import cron from 'node-cron';

export interface ScheduledJob {
  id: string;
  name: string;
  cronExpression: string;
  handler: () => Promise<void> | void;
  nextRun?: Date;
  lastRun?: Date;
  isRunning: boolean;
  task?: cron.ScheduledTask;
}

export class JobScheduler {
  private jobs: Map<string, ScheduledJob> = new Map();
  private running = false;

  /**
   * Schedule a new job
   */
  schedule(
    name: string,
    cronExpression: string,
    handler: () => Promise<void> | void
  ): string {
    try {
      const id = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const job: ScheduledJob = {
        id,
        name,
        cronExpression,
        handler,
        isRunning: false,
      };

      if (this.running) {
        job.task = cron.schedule(cronExpression, async () => {
          await this.executeJob(job);
        });
      }

      this.jobs.set(id, job);
      console.log(`Job scheduled: ${name} (${id}) with cron: ${cronExpression}`);

      return id;
    } catch (error) {
      console.error(`Failed to schedule job ${name}:`, error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled job
   */
  cancel(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (job) {
      if (job.task) {
        job.task.stop();
      }
      this.jobs.delete(jobId);
      console.log(`Job cancelled: ${job.name} (${jobId})`);
      return true;
    }
    return false;
  }

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.running) {
      return;
    }

    this.running = true;

    this.jobs.forEach((job) => {
      job.task = cron.schedule(job.cronExpression, async () => {
        await this.executeJob(job);
      });
    });

    console.log(`Job scheduler started with ${this.jobs.size} jobs`);
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (!this.running) {
      return;
    }

    this.running = false;

    this.jobs.forEach((job) => {
      if (job.task) {
        job.task.stop();
      }
    });

    console.log('Job scheduler stopped');
  }

  /**
   * Execute a job
   */
  private async executeJob(job: ScheduledJob): Promise<void> {
    if (job.isRunning) {
      console.warn(`Job ${job.name} is already running, skipping`);
      return;
    }

    job.isRunning = true;
    job.nextRun = new Date(Date.now() + this.getNextRunDelay(job.cronExpression));

    try {
      console.log(`Executing job: ${job.name} (${job.id})`);
      const startTime = Date.now();

      await job.handler();

      job.lastRun = new Date();
      const duration = Date.now() - startTime;
      console.log(
        `Job completed: ${job.name} (${job.id}) in ${duration}ms`
      );
    } catch (error) {
      console.error(`Job failed: ${job.name} (${job.id})`, error);
    } finally {
      job.isRunning = false;
    }
  }

  /**
   * Get next run time estimate (simplified)
   */
  private getNextRunDelay(cronExpression: string): number {
    // Simplified: just return 1 minute for now
    // In production, use cron-parser for accurate calculations
    return 60 * 1000;
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): ScheduledJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get all jobs
   */
  getAllJobs(): ScheduledJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Built-in job: Send reminders
   */
  scheduleReminders(getReminders: () => Promise<any[]>): string {
    return this.schedule('send-reminders', '0 * * * *', async () => {
      const reminders = await getReminders();
      console.log(`Processing ${reminders.length} reminders`);
      // Send reminders via webhook/email
    });
  }

  /**
   * Built-in job: Cleanup old data
   */
  scheduleCleanup(cleanup: () => Promise<void>): string {
    return this.schedule('cleanup-old-data', '0 2 * * 0', async () => {
      console.log('Running cleanup job');
      await cleanup();
    });
  }

  /**
   * Built-in job: Export data
   */
  scheduleExport(exportData: () => Promise<void>): string {
    return this.schedule('export-data', '0 4 * * 0', async () => {
      console.log('Running export job');
      await exportData();
    });
  }

  /**
   * Built-in job: Sync with external calendars
   */
  scheduleCalendarSync(sync: () => Promise<void>): string {
    return this.schedule('sync-calendars', '*/30 * * * *', async () => {
      console.log('Running calendar sync');
      await sync();
    });
  }

  /**
   * Built-in job: Health check
   */
  scheduleHealthCheck(healthCheck: () => Promise<boolean>): string {
    return this.schedule('health-check', '*/5 * * * *', async () => {
      const healthy = await healthCheck();
      if (!healthy) {
        console.warn('Health check failed');
      }
    });
  }
}
