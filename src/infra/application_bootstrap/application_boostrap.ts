import { type Logger } from "../logger/logger.ts";
import { type MessageBroker } from "../message_broker/message_broker.ts";
import { type CmeQueueConsumer } from "../../app/queue/cme_queue_consumer/cme_queue_consumer.ts";
import { type PtaxQueueConsumer } from "../../app/queue/ptax_queue_consumer/ptax_queue_consumer.ts";
import { type TheNewsQueueConsumer } from "../../app/queue/the_news_queue_consumer/the_news_queue_consumer.ts";

export function createApplicationBootstrap({ providers }: ApplicationBootstrapArgs): ApplicationBootstrap {
	const { logger, messageBroker, ...consumers } = providers;
	const { cmeQueueConsumer, ptaxQueueConsumer, theNewsQueueConsumer } = consumers;

	async function init(): Promise<void> {
		try {
			logger.info("[ApplicationBootstrap] — initializing core services");
			await messageBroker.connect();

			logger.info("[ApplicationBootstrap] — registering message broker consumers");
			cmeQueueConsumer.register();
			theNewsQueueConsumer.register();
			ptaxQueueConsumer.register();
		}

		catch {
			await messageBroker.close();
		}
	}

	return { init }
}

type ApplicationBootstrapArgs = {
	providers: {
		/* Other */
		logger: Logger;

		/* Core */
		messageBroker: MessageBroker;

		/* Consumers */
		cmeQueueConsumer: CmeQueueConsumer;
		theNewsQueueConsumer: TheNewsQueueConsumer;
		ptaxQueueConsumer: PtaxQueueConsumer;
	}
}

type ApplicationBootstrap = {
	init(): Promise<void>;
}