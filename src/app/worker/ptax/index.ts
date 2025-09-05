import { logger } from "../../../infra/logger/index.ts";
import { PtaxWorker } from "./ptax_worker.ts";

export const ptaxWorker = new PtaxWorker(logger);