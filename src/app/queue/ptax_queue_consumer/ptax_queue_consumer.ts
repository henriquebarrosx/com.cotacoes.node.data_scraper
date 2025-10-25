
import { Worker } from "worker_threads";

import { queues } from "../../../infra/message_broker/queues.ts";

import { type Consumer } from "../consumer.ts";
import { type Logger } from "../../../infra/logger/logger.ts";
import type { ConsumerHandlerParam, MessageBroker } from "../../../infra/message_broker/message_broker.ts";

export function createPtaxQueueConsumer({ providers }: PtaxQueueConsumerArgs): Consumer {
    const { logger, messageBroker } = providers;

    async function register() {
        const channel = await messageBroker.createChannel(queues.PTAX_DATA_SCRAPER, 1);

        await messageBroker.listen(
            {
                queue: queues.PTAX_DATA_SCRAPER,
                handler: (...args) => processIncomingMessage(...args),
                channel: channel,
            }
        );
    }

    async function processIncomingMessage({ data }: ConsumerHandlerParam) {
        logger.info("[PtaxQueueConsumer] Posting message to worker...");

        await new Promise<void>((resolve, reject) => {
            const workerURL = new URL("../../worker/ptax/runner.ts", import.meta.url)
            const worker = new Worker(workerURL, { workerData: { date: getTargetDate(data) } });

            worker.on('message', async (message) => {
                logger.info("[PtaxQueueConsumer] Worker finished processing message successfully.");

                const queue = queues.PTAX_DATA_STORE;
                const channel = await messageBroker.createChannel(queue);
                await messageBroker.publish({ channel, message, queue });
                await channel.close();

                await worker.terminate();
                resolve();
            })

            worker.on("error", async (error) => {
                logger.error("[PtaxQueueConsumer] Worker failed to execute:", error);
                await worker.terminate();
                reject(error);
            });
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

type PtaxQueueConsumerArgs = {
    providers: {
        logger: Logger;
        messageBroker: MessageBroker;
    }
}
