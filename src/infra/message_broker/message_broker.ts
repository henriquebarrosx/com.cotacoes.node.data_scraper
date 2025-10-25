import * as Amqp from 'amqplib';
import { type MessageBrokerQueues } from "./queues.ts";

export interface MessageBroker {
	connect(): Promise<void>;
	createChannel(queue: string, prefetch?: number): Promise<Amqp.Channel>;
	publish(args: PublishArgs): Promise<void>;
	listen(args: ConsumeArgs): Promise<void>;
	close(): Promise<void>;
}

export type PublishArgs = {
	channel: Amqp.Channel;
	queue: MessageBrokerQueues;
	message: unknown;
	correlationIdId?: string;
}

export type ConsumeArgs = {
	channel: Amqp.Channel;
	queue: MessageBrokerQueues;
	handler: (param: ConsumerHandlerParam) => Promise<void>;
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