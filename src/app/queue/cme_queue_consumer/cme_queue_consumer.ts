import { CmeWorker } from "../../worker/cme/cme_worker.ts";
import { queues } from "../../../infra/message_broker/queues.ts";
import { AsyncQueue } from "../../../infra/async_queue/async_queue.ts";
import type { ConsumerOutput, MessageBroker } from "../../../infra/message_broker/message_broker.ts";

export class CmeQueueConsumer {

	readonly #cmeWorker: CmeWorker;
	readonly #asyncQueue: AsyncQueue;
	readonly #messageBroker: MessageBroker;

	constructor(
		cmeWorker: CmeWorker,
		asyncQueue: AsyncQueue,
		messageBroker: MessageBroker,
	) {
		this.#cmeWorker = cmeWorker;
		this.#asyncQueue = asyncQueue;
		this.#messageBroker = messageBroker;
	}

	async register() {
		await this.#messageBroker.listen(
			{
				queue: queues.CME_DATA_SCRAPER,
				handler: (...args) => this.processIncomingMessage(...args),
				options: {
					prefetch: 1,
				}
			}
		);
	}

	private async processIncomingMessage({ correlationId, options }: ConsumerOutput) {
		const { channel, message } = options;

		this.#asyncQueue.add(correlationId, async () => {
			const cme = await this.#cmeWorker.execute();
			this.#messageBroker.confirm({ message, from: channel });

			await this.#messageBroker.publish(
				{
					message: cme,
					to: queues.CME_DATA_STORE,
				}
			);
		})
	}

}