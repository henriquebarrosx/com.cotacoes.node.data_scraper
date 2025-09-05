import { AsyncQueue } from "./async_queue.ts";
import { logger } from "../../infra/logger/index.ts";

export const asyncQueue = new AsyncQueue(logger);