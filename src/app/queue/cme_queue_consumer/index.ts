import { cmeWorker } from "../../worker/cme/index.ts";
import { CmeQueueConsumer } from "./cme_queue_consumer.ts";
import { messageBroker } from "../../../infra/message_broker/index.ts";

export const cmeQueueConsumer = new CmeQueueConsumer(cmeWorker, messageBroker);