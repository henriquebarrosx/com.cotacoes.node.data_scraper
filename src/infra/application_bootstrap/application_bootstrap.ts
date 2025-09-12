import { logger } from "../logger/index.ts";
import { messageBroker } from "../message_broker/index.ts";
import { browserManager } from '../browser_manager/index.ts';
import { cmeQueueConsumer } from "../../app/queue/cme_queue_consumer/index.ts";
import { ptaxQueueConsumer } from "../../app/queue/ptax_queue_consumer/index.ts";
import { theNewsQueueConsumer } from "../../app/queue/the_news_queue_consumer/index.ts";

export class ApplicationBootstrap {

	private constructor() { }

	static async init() {
		try {
			logger.info("[ApplicationBootstrap] — initializing core services");
			await messageBroker.connect();
			await browserManager.launch();

			logger.info("[ApplicationBootstrap] — registering message broker consumers");
			await ptaxQueueConsumer.register();
			await cmeQueueConsumer.register();
			await theNewsQueueConsumer.register();
		}

		catch {
			await messageBroker.close();
			await browserManager.closeBrowser();
		}
	}

}