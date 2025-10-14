import { browserManager } from "../../../infra/browser_manager/index.ts";
import { logger } from "../../../infra/logger/index.ts";
import { TheNewsWorker } from "./worker.ts";

export const theNewsWorker = new TheNewsWorker(logger, browserManager);