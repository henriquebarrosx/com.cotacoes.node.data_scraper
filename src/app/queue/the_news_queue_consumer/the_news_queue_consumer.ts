import { CmeWorker } from "../../worker/cme/cme_worker.ts";
import { queues } from "../../../infra/message_broker/queues.ts";
import { TheNewsWorker } from "../../worker/the_news/the_news_worker.ts";

import type { TheNewsInput } from "../../worker/the_news/the_news_worker.ts";
import type { ConsumerOutput, MessageBroker } from "../../../infra/message_broker/message_broker.ts";

export class TheNewsQueueConsumer {

	readonly #theNewsWorker: TheNewsWorker;
	readonly #messageBroker: MessageBroker;

	constructor(
		theNewsWorker: TheNewsWorker,
		messageBroker: MessageBroker,
	) {
		this.#theNewsWorker = theNewsWorker;
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

	private async processIncomingMessage({ data }: ConsumerOutput) {
		const fromDate = this.getTargetDate(data);
		const news = await this.#theNewsWorker.execute(fromDate);
		await this.#messageBroker.publish({ message: news, to: queues.THE_NEWS_ARTICLE_STORE });
	}

	private getTargetDate(data: string): string {
		const { fromDate } = JSON.parse(data) as TheNewsInput;
		return fromDate
	}

}