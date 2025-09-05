import { cmeWorker } from "../../cme/index.ts";
import { CmeQueueConsumer } from "./cme_queue_consumer.ts";
import { asyncQueue } from "../../../infra/async_queue/index.ts";
import { messageBroker } from "../../../infra/message_broker/index.ts";

export const cmeQueueConsumer = new CmeQueueConsumer(cmeWorker, asyncQueue, messageBroker);