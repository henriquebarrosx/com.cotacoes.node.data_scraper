import * as Amqp from 'amqplib';
import type { MessageBrokerQueues } from "./queues.ts";

export interface MessageBroker {
	connect(): Promise<void>;
	publish(params: PublishInput): Promise<void>;
	listen(params: ConsumeInput): Promise<void>;
	confirm(params: DeliveryInput): void;
}

export type PublishInput = {
	to: MessageBrokerQueues;
	message: unknown;
	options?: {
		correlationId: string;
	}
}

export type ConsumeInput = {
	queue: MessageBrokerQueues;
	handler: (output: ConsumerOutput) => Promise<void>;
	options?: Partial<ConsumerInputOptions>
}

export type ConsumerInputOptions = {
	/** number of concurrency incoming messages */
	limit: number;
}

export type ConsumerOutput = {
	correlationId: string;
	data: string;
	options: ConsumerOutputOptions;
}

export type ConsumerOutputOptions = {
	message: Amqp.Message;
	channel: Amqp.Channel
}

export type DeliveryInput = {
	message: Amqp.Message;
	from: Amqp.Channel;
}

export type RetryOptions = {
	queue: MessageBrokerQueues;
	correlationId: string;
	retryCount: number;
	message: Amqp.Message;
}