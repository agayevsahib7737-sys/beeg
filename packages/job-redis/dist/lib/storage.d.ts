import type { JobStorage } from '@remix-run/job/storage';
export interface RedisJobStorageClient {
    sendCommand(command: string[]): Promise<unknown>;
}
export interface RedisJobStorageOptions {
    redis: RedisJobStorageClient;
    prefix?: string;
}
/**
 * Creates a Redis-backed `JobStorage` implementation.
 *
 * @param options Storage configuration
 * @returns A `JobStorage` that persists jobs and schedules in Redis
 */
export declare function createRedisJobStorage(options: RedisJobStorageOptions): JobStorage;
//# sourceMappingURL=storage.d.ts.map