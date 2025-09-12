import { CmeWorker } from "./cme_worker.ts";
import { logger } from "../../../infra/logger/index.ts";
import { browserManager } from "../../../infra/browser_manager/index.ts";

export const cmeWorker = new CmeWorker(logger, browserManager);