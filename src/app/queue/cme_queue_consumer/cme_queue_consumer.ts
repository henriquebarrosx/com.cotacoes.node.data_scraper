
import { Worker } from "worker_threads";

import { queues } from "../../../infra/message_broker/queues.ts";

import { type Consumer } from "../consumer.ts";
import { type Logger } from "../../../infra/logger/logger.ts";
import { type MessageBroker } from "../../../infra/message_broker/message_broker.ts";

export function createCmeQueueConsumer({ providers }: CmeQueueConsumerArgs): Consumer {
    const { logger, messageBroker } = providers;

    async function register() {
        const channel = await messageBroker.createChannel(queues.CME_DATA_SCRAPER, 1);

        await messageBroker.listen(
            {
                queue: queues.CME_DATA_SCRAPER,
                handler: () => processIncomingMessage(),
                channel: channel,
            }
        );
    }

    async function processIncomingMessage() {
        logger.info("[CmeQueueConsumer] Posting message to worker...");

        await new Promise<void>((resolve, reject) => {
            const workerURL = new URL("../../worker/cme/runner.ts", import.meta.url)
            const worker = new Worker(workerURL);

            worker.on('message', async (message) => {
                logger.info("[CmeQueueConsumer] Worker finished processing message successfully.");

                const queue = queues.CME_DATA_STORE;
                const channel = await messageBroker.createChannel(queue);
                await messageBroker.publish({ channel, message, queue });
                await channel.close();

                await worker.terminate();
                resolve();
            })

            worker.on("error", async (error) => {
                logger.error("[CmeQueueConsumer] Worker failed to execute:", error);
                await worker.terminate();
                reject(error);
            });
        });
    }

    return {
        register,
    }
}

type CmeQueueConsumerArgs = {
    providers: {
        logger: Logger;
        messageBroker: MessageBroker;
    }
}
