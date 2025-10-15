
import { Worker } from "worker_threads";

import { queues } from "../../../infra/message_broker/queues.ts";

import { type Consumer } from "../consumer.ts";
import { type Logger } from "../../../infra/logger/logger.ts";
import type { ConsumerHandlerParam, MessageBroker } from "../../../infra/message_broker/message_broker.ts";

export function createPtaxQueueConsumer({ providers }: PtaxQueueConsumerArgs): Consumer {
	const { logger, messageBroker } = providers;

	async function register() {
		await messageBroker.listen(
			{
				queue: queues.PTAX_DATA_SCRAPER,
				handler: (...args) => processIncomingMessage(...args),
				options: { prefetch: 1 }
			}
		);
	}

	async function processIncomingMessage({ data }: ConsumerHandlerParam) {
		logger.info("[PtaxQueueConsumer] Posting message to worker...");

		const workerURL = new URL("../../worker/ptax/runner.ts", import.meta.url)
		const worker = new Worker(workerURL, { workerData: { date: getTargetDate(data) } });

		worker.on('message', (result) => {
			logger.info("[PtaxQueueConsumer] Worker finished processing message successfully.");
			messageBroker.publish({ message: result, to: queues.PTAX_DATA_STORE });
		})

		worker.on("error", (error) => {
			logger.error("[PtaxQueueConsumer] Worker failed to execute:", error);
		});
	}

	function getTargetDate(data: string): string {
		const { fromDate } = JSON.parse(data);
		return fromDate
	}

	return {
		register,
	}
}

type PtaxQueueConsumerArgs = {
	providers: {
		logger: Logger;
		messageBroker: MessageBroker;
	}
}
