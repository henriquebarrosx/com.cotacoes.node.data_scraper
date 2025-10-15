import { parentPort, workerData } from "worker_threads";

import { createTheNewsWorker } from "./worker.ts";
import { logger } from "../../../infra/logger/index.ts";
import { browserManager } from "../../../infra/browser_manager/index.ts";

logger.info("[TheNewsWorker] Starting execution...");

const theNewsWorker = createTheNewsWorker(
	{
		providers: {
			browserManager,
			logger,
		}
	}
);

const result = await theNewsWorker.execute(workerData.date);

logger.info("[TheNewsWorker] Execution completed successfully.");
parentPort?.postMessage(result);
