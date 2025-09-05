import { CmeWorker } from "./cme_worker.ts";
import { logger } from "../../../infra/logger/index.ts";

export const cmeWorker = new CmeWorker(logger);