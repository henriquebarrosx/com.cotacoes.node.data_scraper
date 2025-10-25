import { parentPort, workerData } from "worker_threads";

import { createPtaxWorker } from "./worker.ts";
import { logger } from "../../../infra/logger/index.ts";
import { browserManager } from "../../../infra/browser_manager/index.ts";

logger.info("[PtaxWorker] Starting execution...");

const ptaxWorker = createPtaxWorker(
    {
        providers: {
            browserManager,
            logger,
        }
    }
);

const result = await ptaxWorker.execute(workerData.date);

logger.info("[PtaxWorker] Execution completed successfully.");
parentPort?.postMessage(result);
