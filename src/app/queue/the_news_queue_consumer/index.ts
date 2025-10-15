import { logger } from "../../../infra/logger/index.ts";
import { messageBroker } from "../../../infra/message_broker/index.ts";
import { createTheNewsQueueConsumer } from "./the_news_queue_consumer.ts";

export const theNewsQueueConsumer = createTheNewsQueueConsumer(
	{
		providers: {
			logger: logger,
			messageBroker: messageBroker,
		}
	}
);
