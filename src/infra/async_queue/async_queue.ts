import { Logger } from "../../infra/logger/logger.ts";

export class AsyncQueue {
	#tasks = new Map<string, () => Promise<unknown>>([]);
	#inProcessing = false;

	private readonly logger: Logger;

	constructor(logger: Logger) {
		this.logger = logger;
	}

	add(taskId: string, handler: () => Promise<unknown>) {
		this.logger.info(`[AsyncQueue] Adding async task: ${taskId}`);
		this.#tasks.set(taskId, handler);
		this.#processNext();
	}

	#processNext() {
		const tasks = this.#tasks.entries();
		const next = tasks.next();

		if (next.done || this.#inProcessing) {
			return;
		}

		this.#inProcessing = true;
		const [id, task] = next.value;

		this.logger.info(`[AsyncQueue] Executing async task: ${id}`);

		task()
			.then(() => {
				this.#tasks.delete(id);

				this.logger.info(`[AsyncQueue] Task executed successfully: ${id}`);
				this.logger.info(`[AsyncQueue] Pending enqueued tasks: ${this.#tasks.size}`);
			})
			.catch(() => {
				this.logger.info(`[AsyncQueue] Task execution fail: ${id}`);
			})
			.finally(() => {
				this.#inProcessing = false;
				this.#processNext();
			});
	}

}