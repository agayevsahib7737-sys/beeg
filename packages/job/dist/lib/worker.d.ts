import type { CreateJobWorkerOptions, JobDefinitions, JobWorker } from './types.ts';
/**
 * Creates a worker loop that claims and executes jobs from storage.
 *
 * @param options Worker configuration
 * @returns A `JobWorker` lifecycle controller
 */
export declare function createJobWorker<defs extends JobDefinitions>(options: CreateJobWorkerOptions<defs>): JobWorker;
//# sourceMappingURL=worker.d.ts.map