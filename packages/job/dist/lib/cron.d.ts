import type { CatchUpPolicy } from './types.ts';
export declare function getNextCronRunAt(cron: string, fromMs: number, timeZone?: string): number;
export declare function getCronDispatchCount(cron: string, timeZone: string, catchUp: CatchUpPolicy, nextRunAt: number, now: number): number;
//# sourceMappingURL=cron.d.ts.map