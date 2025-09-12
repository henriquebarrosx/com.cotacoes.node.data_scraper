import { queues } from "../../../infra/message_broker/queues.ts";

import type { PtaxWorker } from "../../worker/ptax/ptax_worker.ts";
import type { PtaxInput } from "../../worker/ptax/ptax_worker.ts";
import type { ConsumerOutput, MessageBroker } from "../../../infra/message_broker/message_broker.ts";

export class PtaxQueueConsumer {

	readonly #ptaxWorker: PtaxWorker;
	readonly #messageBroker: MessageBroker;

	constructor(
		ptaxWorker: PtaxWorker,
		messageBroker: MessageBroker,
	) {
		this.#ptaxWorker = ptaxWorker;
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

	private async processIncomingMessage({ data }: ConsumerOutput) {
		const fromDate = this.getTargetDate(data);
		const ptax = await this.#ptaxWorker.execute(fromDate);
		await this.#messageBroker.publish({ message: ptax, to: queues.PTAX_DATA_STORE });
	}

	private getTargetDate(data: string): string {
		const { fromDate } = JSON.parse(data) as PtaxInput;
		return fromDate
	}
}