import { ptaxWorker } from "../../worker/ptax/index.ts";
import { asyncQueue } from "../../../infra/async_queue/index.ts";
import { messageBroker } from "../../../infra/message_broker/index.ts";
import { PtaxQueueConsumer } from "./ptax_queue_consumer.ts";

export const ptaxQueueConsumer = new PtaxQueueConsumer(ptaxWorker, asyncQueue, messageBroker);