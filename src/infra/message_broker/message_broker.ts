import * as Amqp from 'amqplib';
import type { MessageBrokerQueues } from "./queues.ts";

export interface MessageBroker {
	connect(): Promise<void>;
	publish(params: PublishInput): Promise<void>;
	listen(params: ConsumeInput): Promise<void>;
	close(): Promise<void>;
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
	prefetch: number;
}

export type ConsumerOutput = {
	correlationId: string;
	data: string;
}

export type RetryOptions = {
	queue: MessageBrokerQueues;
	correlationId: string;
	retryCount: number;
	message: Amqp.Message;
}