import * as Amqp from 'amqplib';

import type { Logger } from '../logger/logger.ts';
import type { ConsumeInput, MessageBroker, PublishInput, RetryOptions } from "./message_broker.ts";

/**
 * Repositório: 
 * https://www.npmjs.com/package/amqplib
 */
export class RabbitMQFacade implements MessageBroker {

	readonly #logger: Logger;

	readonly MAX_ALLOWED_RETRIES = 3;

	#conn: Amqp.ChannelModel | null = null;

	constructor(logger: Logger) {
		this.#logger = logger;
	}

	async connect(): Promise<void> {
		await this.keepAlive(async () => {
			try {
				this.#logger.info('[RabbitMQFacade] Establishing new connection');

				const uri = process.env['RABBITMQ_URI'];
				if (!uri) throw new Error('Cannot establish message broker connection: uri not defined');

				this.#conn = await Amqp.connect(uri);
				this.#logger.info('[RabbitMQFacade] Connection established');
			}

			catch (error) {
				this.#logger.error("[RabbitMQFacade] Failed to establish a connection", error);
				await this.reconnect();
			}
		})
	}

	private async keepAlive(handler: () => Promise<void>) {
		while (!this.#conn) {
			await handler();
		}
	}

	private async reconnect() {
		this.#logger.info("[RabbitMQFacade] Trying establish new connection at 5s");
		await this.sleep(5_000);
		this.#conn = null;
	}

	private async sleep(delay: number = 5000) {
		await new Promise(res => setTimeout(res, delay));
	}

	async publish({ to: queue, message }: PublishInput): Promise<void> {
		if (!this.#conn) {
			throw new Error('Cannot publish message: must establish a connection first')
		}

		const channel = await this.#conn.createChannel();
		await channel.assertQueue(queue, { durable: true });

		const correlationId = crypto.randomUUID();

		channel.sendToQueue(
			queue,
			Buffer.from(JSON.stringify(message)),
			{
				persistent: true,
				contentType: 'application/json',
				correlationId: correlationId,
			},
		);

		this.#logger.info('[RabbitMQFacade] Publishing new message');
		this.#logger.json({ id: correlationId, event: 'PUBLISH', queue: queue });
	}

	async listen({ queue, handler, options = {} }: ConsumeInput): Promise<void> {
		if (!this.#conn) {
			throw new Error(`Cannot consume message for queue ${queue}: must establish a connection first`)
		}

		const channel = await this.#conn.createChannel();
		await channel.assertQueue(queue, { durable: true });
		await channel.prefetch(options?.prefetch ?? 0);

		channel.consume(
			queue,
			async (message: Amqp.ConsumeMessage | null) => {
				if (!message) return;

				this.#logger.info('[RabbitMQFacade] Receiving new message');
				const retryCount = Number(message.properties.headers?.["x-retry"] ?? 0);

				this.#logger.json(
					{
						id: message.properties.correlationId,
						event: 'RECEIVED',
						queue: queue,
						args: {
							retries: `${retryCount}/${this.MAX_ALLOWED_RETRIES}`,
							failed: retryCount !== 0,
						}
					}
				);

				try {
					await handler({
						correlationId: message.properties.correlationId!,
						data: message.content.toString(),
					});

					channel.ack(message);
				}

				catch {
					const retryCount = Number(message.properties.headers?.["x-retry"] ?? 0);

					if (retryCount >= this.MAX_ALLOWED_RETRIES) {
						this.#logger.error(`[RabbitMQFacade] Max retries reached for ${message.properties.correlationId} at ${queue} queue, discarding...`);
						channel.ack(message);
						return;
					}

					await this.asyncRetry(
						channel,
						{
							correlationId: message.properties.correlationId!,
							queue: queue,
							retryCount: retryCount,
							message: message,
						}
					)
				}
			},
			{
				noAck: false,
			}
		)

		this.#logger.info(`[RabbitMQFacade] New consumer registered for queue ${queue}`);
	}

	private async asyncRetry(channel: Amqp.Channel, options: RetryOptions) {
		const { queue, correlationId, message, retryCount } = options;

		await this.sleep(30_000);

		channel.sendToQueue(
			queue,
			message.content,
			{
				contentType: 'application/json',
				correlationId: correlationId,
				headers: { "x-retry": retryCount + 1 },
			},
		);

		channel.ack(message);
	}

}