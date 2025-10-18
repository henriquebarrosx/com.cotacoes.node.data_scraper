
import { Worker } from "worker_threads";

import { queues } from "../../../infra/message_broker/queues.ts";

import { type Consumer } from "../consumer.ts";
import { type Logger } from "../../../infra/logger/logger.ts";
import { type MessageBroker } from "../../../infra/message_broker/message_broker.ts";

export function createCmeQueueConsumer({ providers }: CmeQueueConsumerArgs): Consumer {
    const { logger, messageBroker } = providers;

    async function register() {
        await messageBroker.listen(
            {
                queue: queues.CME_DATA_SCRAPER,
                handler: () => processIncomingMessage(),
                options: { prefetch: 1 }
            }
        );
    }

    async function processIncomingMessage() {
        logger.info("[CmeQueueConsumer] Posting message to worker...");

        const workerURL = new URL("../../worker/cme/runner.ts", import.meta.url)
        const worker = new Worker(workerURL);

        worker.on('message', async (result) => {
            logger.info("[CmeQueueConsumer] Worker finished processing message successfully.");
            await messageBroker.publish({ message: result, to: queues.CME_DATA_STORE });
            await worker.terminate();
        })

        worker.on("error", async (error) => {
            logger.error("[CmeQueueConsumer] Worker failed to execute:", error);
            await worker.terminate();
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
