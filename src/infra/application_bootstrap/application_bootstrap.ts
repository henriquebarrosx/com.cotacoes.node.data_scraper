import { logger } from "../logger/index.ts";
import { messageBroker } from "../message_broker/index.ts";
import { cmeQueueConsumer } from "../../app/queue/cme_queue_consumer/index.ts";
import { ptaxQueueConsumer } from "../../app/queue/ptax_queue_consumer/index.ts";
import { theNewsQueueConsumer } from "../../app/queue/the_news_queue_consumer/index.ts";

export class ApplicationBootstrap {

	private constructor() { }

	static async init() {
		logger.info("[ApplicationBootstrap] — initializing core services");
		await messageBroker.connect();

		logger.info("[ApplicationBootstrap] — initializing message broker queues");
		await cmeQueueConsumer.register();
		await ptaxQueueConsumer.register();
		await theNewsQueueConsumer.register();
	}

}