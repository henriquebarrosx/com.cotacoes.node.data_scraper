import { CmeWorker } from "../../worker/cme/cme_worker.ts";
import { queues } from "../../../infra/message_broker/queues.ts";

import type { MessageBroker } from "../../../infra/message_broker/message_broker.ts";

export class CmeQueueConsumer {

	readonly #cmeWorker: CmeWorker;
	readonly #messageBroker: MessageBroker;

	constructor(
		cmeWorker: CmeWorker,
		messageBroker: MessageBroker,
	) {
		this.#cmeWorker = cmeWorker;
		this.#messageBroker = messageBroker;
	}

	async register() {
		await this.#messageBroker.listen(
			{
				queue: queues.CME_DATA_SCRAPER,
				handler: () => this.processIncomingMessage(),
				options: { prefetch: 1 }
			}
		);
	}

	private async processIncomingMessage() {
		const cme = await this.#cmeWorker.execute();
		await this.#messageBroker.publish({ message: cme, to: queues.CME_DATA_STORE });
	}

}