import { queues } from "../../../infra/message_broker/queues.ts";

import { type Consumer } from "../consumer.ts";
import { type CmeWorker } from "../../worker/cme/worker.ts";
import { type MessageBroker } from "../../../infra/message_broker/message_broker.ts";

export function createCmeQueueConsumer({ providers }: CmeQueueConsumerArgs): Consumer {
	const { worker, messageBroker } = providers;

	async function register() {
		await messageBroker.listen(
			{
				queue: queues.CME_DATA_SCRAPER,
				handler: () => processIncomingMessage(),
				options: { prefetch: 1 }
			}
		);
	}

	async function processIncomingMessage() {
		const cme = await worker.execute();
		await messageBroker.publish({ message: cme, to: queues.CME_DATA_STORE });
	}

	return {
		register,
	}
}

export type CmeQueueConsumerArgs = {
	providers: {
		worker: CmeWorker;
		messageBroker: MessageBroker;
	}
}
