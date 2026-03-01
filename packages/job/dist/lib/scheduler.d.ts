import type { CreateJobSchedulerOptions, JobDefinitions, JobScheduler } from './types.ts';
/**
 * Creates a typed map of job handlers.
 *
 * @param jobs Job definitions keyed by name
 * @returns The same job definition object with preserved key/schema types
 */
export declare function createJobs<defs extends JobDefinitions>(jobs: defs): defs;
/**
 * Creates a job scheduler backed by a `JobStorage` implementation.
 *
 * @param options Scheduler configuration
 * @returns A `JobScheduler` for enqueuing and querying jobs
 */
export declare function createJobScheduler<defs extends JobDefinitions, transaction = never>(options: CreateJobSchedulerOptions<defs, transaction>): JobScheduler<defs, transaction>;
//# sourceMappingURL=scheduler.d.ts.map