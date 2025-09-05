import { theNewsWorker } from "../../worker/the_news/index.ts";
import { asyncQueue } from "../../../infra/async_queue/index.ts";
import { TheNewsQueueConsumer } from "./the_news_queue_consumer.ts";
import { messageBroker } from "../../../infra/message_broker/index.ts";

export const theNewsQueueConsumer = new TheNewsQueueConsumer(theNewsWorker, asyncQueue, messageBroker);