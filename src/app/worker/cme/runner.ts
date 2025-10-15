import { parentPort } from "worker_threads";

import { CmeWorker } from "./worker.ts";
import { logger } from "../../../infra/logger/index.ts";
import { browserManager } from "../../../infra/browser_manager/index.ts";

logger.info("[CmeWorker] Starting execution...");

const cmeWorker = new CmeWorker(logger, browserManager);
const cmeData = await cmeWorker.execute();

logger.info("[CmeWorker] Execution completed successfully.");

parentPort?.postMessage(cmeData);
