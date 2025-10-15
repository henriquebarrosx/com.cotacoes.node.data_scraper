import { logger } from "../../../infra/logger/index.ts";
import { createPtaxQueueConsumer } from "./ptax_queue_consumer.ts";
import { messageBroker } from "../../../infra/message_broker/index.ts";

export const ptaxQueueConsumer = createPtaxQueueConsumer(
	{
		providers: {
			logger: logger,
			messageBroker: messageBroker,
		}
	}
);