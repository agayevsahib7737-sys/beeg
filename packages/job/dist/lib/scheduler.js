import { parse } from '@remix-run/data-schema';
import { normalizeRetryPolicy } from "./retry.js";
/**
 * Creates a typed map of job handlers.
 *
 * @param jobs Job definitions keyed by name
 * @returns The same job definition object with preserved key/schema types
 */
export function createJobs(jobs) {
    return jobs;
}
/**
 * Creates a job scheduler backed by a `JobStorage` implementation.
 *
 * @param options Scheduler configuration
 * @returns A `JobScheduler` for enqueuing and querying jobs
 */
export function createJobScheduler(options) {
    let jobs = options.jobs;
    let storage = options.storage;
    let hooks = options;
    let jobNames = new WeakMap();
    for (let name in jobs) {
        let definition = jobs[name];
        if (definition != null && typeof definition === 'object') {
            jobNames.set(definition, name);
        }
    }
    return {
        async enqueue(job, payload, enqueueOptions) {
            let jobName = resolveJobName(job, jobNames);
            let definition = jobs[jobName];
            if (definition == null) {
                throw new Error(`Unknown job "${jobName}"`);
            }
            if (enqueueOptions?.delay != null && enqueueOptions.runAt != null) {
                throw new Error('enqueue options cannot include both "delay" and "runAt"');
            }
            let parsedPayload = parse(definition.schema, payload);
            let now = Date.now();
            let queue = enqueueOptions?.queue ?? 'default';
            let runAt = resolveRunAt(now, enqueueOptions);
            let priority = normalizeWholeNumber(enqueueOptions?.priority, 0, Number.MIN_SAFE_INTEGER);
            let retry = normalizeRetryPolicy(definition.retry, enqueueOptions?.retry);
            let result = await storage.enqueue({
                name: jobName,
                queue,
                payload: parsedPayload,
                runAt,
                priority,
                retry,
                dedupeKey: enqueueOptions?.dedupeKey,
                dedupeTtlMs: enqueueOptions?.dedupeTtlMs,
                createdAt: now,
            }, {
                transaction: enqueueOptions?.transaction,
            });
            await runSchedulerHook(hooks, {
                hook: 'onEnqueue',
                event: {
                    job,
                    jobName,
                    payload: parsedPayload,
                    options: enqueueOptions,
                    result,
                },
            });
            return result;
        },
        get(jobId) {
            return storage.get(jobId);
        },
        async cancel(jobId, cancelOptions) {
            let canceled = await storage.cancel(jobId, {
                transaction: cancelOptions?.transaction,
            });
            await runSchedulerHook(hooks, {
                hook: 'onCancel',
                event: {
                    jobId,
                    options: cancelOptions,
                    canceled,
                },
            });
            return canceled;
        },
        listFailedJobs(failedJobOptions) {
            return storage.listFailedJobs({
                queue: failedJobOptions?.queue,
                limit: normalizeOptionalWholeNumber(failedJobOptions?.limit, 50, 1),
            });
        },
        async replayFailedJob(jobId, replayOptions) {
            let replayed = await storage.replayFailedJob({
                jobId,
                runAt: replayOptions?.runAt?.getTime(),
                priority: replayOptions?.priority == null
                    ? undefined
                    : normalizeWholeNumber(replayOptions.priority, 0, Number.MIN_SAFE_INTEGER),
                queue: replayOptions?.queue,
            }, {
                transaction: replayOptions?.transaction,
            });
            if (replayed == null) {
                throw new Error(`Cannot replay job "${jobId}": job not found or not failed`);
            }
            let result = {
                jobId: replayed.jobId,
            };
            await runSchedulerHook(hooks, {
                hook: 'onReplayFailedJob',
                event: {
                    jobId,
                    options: replayOptions,
                    result,
                },
            });
            return result;
        },
        async prune(pruneOptions) {
            let now = Date.now();
            let result = await storage.prune({
                completedBefore: resolvePruneCutoff(now, pruneOptions.policy.completedOlderThanMs),
                failedBefore: resolvePruneCutoff(now, pruneOptions.policy.failedOlderThanMs),
                canceledBefore: resolvePruneCutoff(now, pruneOptions.policy.canceledOlderThanMs),
                limit: normalizeWholeNumber(pruneOptions.limit, 500, 1),
            }, {
                transaction: pruneOptions.transaction,
            });
            await runSchedulerHook(hooks, {
                hook: 'onPrune',
                event: {
                    options: pruneOptions,
                    result,
                },
            });
            return result;
        },
    };
}
function resolveJobName(value, names) {
    let name = names.get(value);
    if (name == null) {
        throw new Error('Unknown job definition passed to enqueue()');
    }
    return name;
}
function resolveRunAt(now, options) {
    if (options?.runAt != null) {
        return options.runAt.getTime();
    }
    if (options?.delay != null) {
        return now + normalizeWholeNumber(options.delay, 0, 0);
    }
    return now;
}
function resolvePruneCutoff(now, olderThanMs) {
    if (olderThanMs == null) {
        return undefined;
    }
    return now - normalizeWholeNumber(olderThanMs, 0, 0);
}
function normalizeOptionalWholeNumber(value, fallback, minValue) {
    if (value == null) {
        return undefined;
    }
    return normalizeWholeNumber(value, fallback, minValue);
}
async function runSchedulerHook(hooks, invocation) {
    if (hooks == null) {
        return;
    }
    try {
        if (invocation.hook === 'onEnqueue') {
            if (hooks.onEnqueue == null) {
                return;
            }
            await hooks.onEnqueue(invocation.event);
            return;
        }
        if (invocation.hook === 'onCancel') {
            if (hooks.onCancel == null) {
                return;
            }
            await hooks.onCancel(invocation.event);
            return;
        }
        if (invocation.hook === 'onReplayFailedJob') {
            if (hooks.onReplayFailedJob == null) {
                return;
            }
            await hooks.onReplayFailedJob(invocation.event);
            return;
        }
        if (hooks.onPrune == null) {
            return;
        }
        await hooks.onPrune(invocation.event);
    }
    catch (error) {
        if (hooks.onHookError == null) {
            return;
        }
        try {
            await hooks.onHookError({
                hook: invocation.hook,
                event: invocation.event,
                error,
            });
        }
        catch {
            // Hook errors are fail-open by design.
        }
    }
}
function normalizeWholeNumber(value, fallback, minValue) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return fallback;
    }
    let normalized = Math.floor(value);
    if (normalized < minValue) {
        return minValue;
    }
    return normalized;
}
