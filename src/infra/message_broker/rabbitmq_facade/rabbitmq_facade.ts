import * as Amqp from 'amqplib';

import { type Logger } from '../../logger/logger.ts';
import type { MessageBroker, PublishArgs, ConsumeArgs, RetryOptions, ConsumerOnMessageHandler } from '../message_broker.ts';

/**
 * Repositório: 
 * https://www.npmjs.com/package/amqplib
 */
export function createRabbitMQFacade({ providers }: RabbitMQFacadeArgs): MessageBroker {
	const { logger } = providers;

	let connection: Amqp.ChannelModel | null = null;
	const MAX_ALLOWED_RETRIES = 3;

	async function connect(): Promise<void> {
		await keepAlive(
			async () => {
				try {
					logger.info('[RabbitMQFacade] Establishing new connection');

					const uri = process.env['RABBITMQ_URI'];
					if (!uri) throw new Error('Cannot establish message broker connection: uri not defined');

					connection = await Amqp.connect(uri);
					logger.info('[RabbitMQFacade] Connection established');
				}

				catch (error) {
					logger.error("[RabbitMQFacade] Failed to establish a connection", error);
					await reconnect();
				}
			}
		)
	}

	async function keepAlive(handler: () => Promise<void>): Promise<void> {
		while (!connection) {
			await handler();
		}
	}

	async function reconnect(): Promise<void> {
		logger.info("[RabbitMQFacade] Trying establish new connection at 5s");
		await sleep(5_000);
		connection = null;
	}

	async function sleep(delay: number = 5000): Promise<void> {
		await new Promise(res => setTimeout(res, delay));
	}

	async function publish({ to: queue, message }: PublishArgs): Promise<void> {
		if (!connection) throw new Error('Cannot publish message: connection not found');

		const channel = await connection.createChannel();
		await channel.assertQueue(queue, { durable: true });

		const correlationId = crypto.randomUUID();

		logger.info(
			'[RabbitMQFacade] Publishing new message',
			{
				id: correlationId,
				queue: queue,
			}
		);

		const hasBeenSent = channel.sendToQueue(
			queue,
			Buffer.from(JSON.stringify(message)),
			{
				persistent: true,
				contentType: 'application/json',
				correlationId: correlationId,
			},
		);

		if (hasBeenSent) {
			await channel.close();
		}
	}

	async function listen({ queue, handler, options = {} }: ConsumeArgs): Promise<void> {
		if (!connection) throw new Error(`Cannot consume message for queue ${queue}: connection not found`);

		const channel = await connection.createChannel();
		await channel.assertQueue(queue, { durable: true });
		await channel.prefetch(options?.prefetch ?? 0);

		channel.consume(
			queue,
			async (message: Amqp.ConsumeMessage | null) => {
				if (!message) return;

				await handleIncomingMessage(
					{
						queue: queue,
						message: message,
						channel: channel,
						handler: handler,
					}
				)
			},
			{ noAck: false }
		)

		logger.info(`[RabbitMQFacade] New consumer registered for queue ${queue}`);
	}

	async function handleIncomingMessage(args: ConsumerOnMessageHandler): Promise<void> {
		const { channel, queue, message, handler } = args;

		const retryCount = Number(message.properties.headers?.["x-retry"] ?? 0);

		logger.info(
			'[RabbitMQFacade] Receiving new message',
			{
				id: message.properties.correlationId,
				queue: queue,
				args: {
					retries: `${retryCount}/${MAX_ALLOWED_RETRIES}`,
					failed: retryCount !== 0,
				}
			}
		);

		try {
			await handler(
				{
					correlationId: message.properties.correlationId!,
					data: message.content.toString(),
				}
			);

			channel.ack(message);
		}

		catch {
			const retryCount = Number(message.properties.headers?.["x-retry"] ?? 0);

			if (retryCount >= MAX_ALLOWED_RETRIES) {
				logger.error(`[RabbitMQFacade] Max retries reached for ${message.properties.correlationId} at ${queue} queue, discarding...`);
				channel.ack(message);
				return;
			}

			await asyncRetry(
				channel,
				{
					message: message,
					correlationId: message.properties.correlationId!,
					retryCount: retryCount,
					queue: queue,
				}
			)
		}
	}

	async function asyncRetry(channel: Amqp.Channel, options: RetryOptions): Promise<void> {
		const { queue, correlationId, message, retryCount } = options;

		await sleep(30_000);

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

	async function close(): Promise<void> {
		logger.info('[RabbitMQFacade] Closing connection');

		if (!connection) {
			throw new Error('Cannot close connection: connection not found')
		}

		await connection.close();
	}

	return {
		connect,
		publish,
		listen,
		close,
	}
}

type RabbitMQFacadeArgs = {
	providers: {
		logger: Logger;
	}
}
