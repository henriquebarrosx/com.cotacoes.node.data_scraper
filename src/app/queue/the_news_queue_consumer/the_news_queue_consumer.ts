import { Worker } from "worker_threads";

import { queues } from "../../../infra/message_broker/queues.ts";

import { type Consumer } from "../consumer.ts";
import { type Logger } from "../../../infra/logger/logger.ts";
import type { ConsumerHandlerParam, MessageBroker } from "../../../infra/message_broker/message_broker.ts";

export function createTheNewsQueueConsumer({ providers }: TheNewsQueueConsumerArgs): Consumer {
    const { logger, messageBroker } = providers;

    async function register() {
        await messageBroker.listen(
            {
                queue: queues.THE_NEWS_SCRAPER,
                handler: (...args) => processIncomingMessage(...args),
                options: { prefetch: 1 }
            }
        );
    }

    async function processIncomingMessage({ data }: ConsumerHandlerParam) {
        logger.info("[TheNewsQueueConsumer] Posting message to worker...");

        const workerURL = new URL("../../worker/the_news/runner.ts", import.meta.url)
        const worker = new Worker(workerURL, { workerData: { date: getTargetDate(data) } });

        worker.on('message', async (result) => {
            logger.info("[TheNewsQueueConsumer] Worker finished processing message successfully.");
            await messageBroker.publish({ message: result, to: queues.THE_NEWS_ARTICLE_STORE });
            worker.unref();
        })

        worker.on("error", async (error) => {
            logger.error("[TheNewsQueueConsumer] Worker failed to execute:", error);
            worker.unref();
        });

        worker.on("exit", (code) => {
            logger.info(`[TheNewsQueueConsumer] Worker exited with code ${code}`);
        });
    }

    function getTargetDate(data: string): string {
        const { fromDate } = JSON.parse(data);
        return fromDate
    }

    return {
        register,
    }
}

type TheNewsQueueConsumerArgs = {
    providers: {
        logger: Logger;
        messageBroker: MessageBroker;
    }
}
