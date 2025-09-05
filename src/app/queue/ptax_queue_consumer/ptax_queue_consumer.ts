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
				options: { prefetch: 1 }
			}
		);
	}

	private async processIncomingMessage(output: ConsumerOutput) {
		const { correlationId, data, options: { channel, message } } = output;

		this.#asyncQueue.add(correlationId, async () => {
			try {
				const { fromDate } = JSON.parse(data) as PtaxInput;
				const ptax = await this.#ptaxWorker.execute(fromDate);

				this.#messageBroker.confirm({ message, from: channel });

				await this.#messageBroker.publish(
					{
						message: ptax,
						to: queues.PTAX_DATA_STORE,
					}
				);
			}

			catch (error) {
				this.#messageBroker.reject(
					{
						queue: queues.PTAX_DATA_STORE,
						channel: channel,
						message: message,
					}
				);
			}
		})
	}

}