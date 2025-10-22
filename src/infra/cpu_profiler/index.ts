import { logger } from "../logger/index.ts";
import { createCpuProfiler } from "./cpu_profiler.ts";

export const cpuProfiler = createCpuProfiler(
    {
        providers: {
            logger: logger
        }
    }
)
