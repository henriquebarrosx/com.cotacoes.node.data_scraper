import { logger } from "../../../infra/logger/index.ts";
import { TheNewsWorker } from "./the_news_worker.ts";

export const theNewsWorker = new TheNewsWorker(logger);