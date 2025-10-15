import { logger } from "../../../infra/logger/index.ts";
import { createCmeQueueConsumer } from "./cme_queue_consumer.ts";
import { messageBroker } from "../../../infra/message_broker/index.ts";

export const cmeQueueConsumer = createCmeQueueConsumer(
	{
		providers: {
			logger: logger,
			messageBroker: messageBroker,
		}
	}
);