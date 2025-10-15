import { logger } from "../logger/index.ts";
import { messageBroker } from "../message_broker/index.ts";
import { createApplicationBootstrap } from "./application_boostrap.ts";
import { cmeQueueConsumer } from "../../app/queue/cme_queue_consumer/index.ts";
import { ptaxQueueConsumer } from "../../app/queue/ptax_queue_consumer/index.ts";
import { theNewsQueueConsumer } from "../../app/queue/the_news_queue_consumer/index.ts";

export const applicationBoostrap = createApplicationBootstrap(
	{
		providers: {
			logger: logger,
			messageBroker: messageBroker,
			cmeQueueConsumer: cmeQueueConsumer,
			theNewsQueueConsumer: theNewsQueueConsumer,
			ptaxQueueConsumer: ptaxQueueConsumer,
		}
	}
);