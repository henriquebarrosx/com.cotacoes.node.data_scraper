import { PtaxWorker } from "../../worker/ptax/ptax_worker.ts";
import { queues } from "../../../infra/message_broker/queues.ts";
import { AsyncQueue } from "../../../infra/async_queue/async_queue.ts";

import type { PtaxInput } from "../../worker/ptax/ptax_worker.ts";
import type { ConsumerOutput, MessageBroker } from "../../../infra/message_broker/message_broker.ts";

export class PtaxQueueConsumer {

	readonly #ptaxWorker: PtaxWorker;
	readonly #asyncQueue: AsyncQueue;
	readonly #messageBroker: MessageBroker;

	constructor(
		ptaxWorker: PtaxWorker,
		asyncQueue: AsyncQueue,
		messageBroker: MessageBroker,
	) {
		this.#ptaxWorker = ptaxWorker;
		this.#asyncQueue = asyncQueue;
		this.#messageBroker = messageBroker;
	}

	async register() {
		await this.#messageBroker.listen(
			{
				queue: queues.PTAX_DATA_SCRAPER,
				handler: (...args) => this.processIncomingMessage(...args),
			}
		);
	}

	private async processIncomingMessage({ correlationId, data, options }: ConsumerOutput) {
		const { channel, message } = options;

		this.#asyncQueue.add(correlationId, async () => {
			const { fromDate } = JSON.parse(data) as PtaxInput;
			const ptax = await this.#ptaxWorker.execute(fromDate);

			this.#messageBroker.confirm({ message, from: channel });

			await this.#messageBroker.publish(
				{
					message: ptax,
					to: queues.PTAX_DATA_STORE,
				}
			);
		})
	}

}