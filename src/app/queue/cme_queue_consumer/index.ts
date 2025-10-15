import { cmeWorker } from "../../worker/cme/index.ts";
import { createCmeQueueConsumer } from "./cme_queue_consumer.ts";
import { messageBroker } from "../../../infra/message_broker/index.ts";

export const cmeQueueConsumer = createCmeQueueConsumer(
	{
		providers: {
			worker: cmeWorker,
			messageBroker: messageBroker,
		}
	}
);