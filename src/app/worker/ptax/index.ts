import { browserManager } from "../../../infra/browser_manager/index.ts";
import { logger } from "../../../infra/logger/index.ts";
import { PtaxWorker } from "./worker.ts";

export const ptaxWorker = new PtaxWorker(logger, browserManager);