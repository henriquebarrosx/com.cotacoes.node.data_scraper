import { CmeWorker } from "./worker.ts";
import { logger } from "../../../infra/logger/index.ts";
import { browserManager } from "../../../infra/browser_manager/index.ts";

export const cmeWorker = new CmeWorker(logger, browserManager);