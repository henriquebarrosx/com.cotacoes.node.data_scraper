import { CmeWorker } from "../../worker/cme/cme_worker.ts";
import { queues } from "../../../infra/message_broker/queues.ts";
import { AsyncQueue } from "../../../infra/async_queue/async_queue.ts";
import { TheNewsWorker } from "../../worker/the_news/the_news_worker.ts";

import type { TheNewsInput } from "../../worker/the_news/the_news_worker.ts";
import type { ConsumerOutput, MessageBroker } from "../../../infra/message_broker/message_broker.ts";

export class TheNewsQueueConsumer {

	readonly #theNewsWorker: TheNewsWorker;
	readonly #asyncQueue: AsyncQueue;
	readonly #messageBroker: MessageBroker;

	constructor(
		theNewsWorker: TheNewsWorker,
		asyncQueue: AsyncQueue,
		messageBroker: MessageBroker,
	) {
		this.#theNewsWorker = theNewsWorker;
		this.#asyncQueue = asyncQueue;
		this.#messageBroker = messageBroker;
	}

	async register() {
		await this.#messageBroker.listen(
			{
				queue: queues.THE_NEWS_SCRAPER,
				handler: (...args) => this.processIncomingMessage(...args),
				options: { prefetch: 1 }
			}
		);
	}

	private async processIncomingMessage({ correlationId, data, options }: ConsumerOutput) {
		const { channel, message } = options;

		this.#asyncQueue.add(correlationId, async () => {
			try {
				const { fromDate } = JSON.parse(data) as TheNewsInput;
				const news = await this.#theNewsWorker.execute(fromDate);

				this.#messageBroker.confirm(
					{
						message,
						from: channel,
					}
				);

				await this.#messageBroker.publish(
					{
						message: news,
						to: queues.THE_NEWS_ARTICLE_STORE,
					}
				);
			}

			catch (error) {
				this.#messageBroker.reject(
					{
						queue: queues.THE_NEWS_SCRAPER,
						channel: channel,
						message: message,
					}
				);
			}
		})
	}

}