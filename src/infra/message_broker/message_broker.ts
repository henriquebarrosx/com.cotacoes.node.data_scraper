import * as Amqp from 'amqplib';
import { type MessageBrokerQueues } from "./queues.ts";

export interface MessageBroker {
	connect(): Promise<void>;
	publish(args: PublishArgs): Promise<void>;
	listen(args: ConsumeArgs): Promise<void>;
	close(): Promise<void>;
}

export type PublishArgs = {
	to: MessageBrokerQueues;
	message: unknown;
	options?: {
		correlationId: string;
	}
}

export type ConsumeArgs = {
	queue: MessageBrokerQueues;
	handler: (param: ConsumerHandlerParam) => Promise<void>;
	options?: Partial<ConsumerOptions>
}

export type ConsumerOptions = {
	/** number of concurrency incoming messages */
	prefetch: number;
}

export type ConsumerHandlerParam = {
	correlationId: string;
	data: string;
}

export type ConsumerOnMessageHandler = Omit<ConsumeArgs, 'options'> & {
	message: Amqp.Message;
	channel: Amqp.Channel;
}

export type RetryOptions = {
	queue: MessageBrokerQueues;
	correlationId: string;
	retryCount: number;
	message: Amqp.Message;
}