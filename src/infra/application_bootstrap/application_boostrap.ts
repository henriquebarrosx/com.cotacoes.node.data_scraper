import { type Logger } from "../logger/logger.ts";
import { type Consumer } from "../../app/queue/consumer.ts";
import { type MessageBroker } from "../message_broker/message_broker.ts";

export function createApplicationBootstrap({ providers }: ApplicationBootstrapArgs): ApplicationBootstrap {
    const { logger, messageBroker, ...consumers } = providers;
    const { cmeQueueConsumer, ptaxQueueConsumer, theNewsQueueConsumer } = consumers;

    async function init(): Promise<void> {
        try {
            logger.info("[ApplicationBootstrap] Initializing core services");
            await messageBroker.connect();

            logger.info("[ApplicationBootstrap] Registering message broker consumers");
            await cmeQueueConsumer.register();
            await theNewsQueueConsumer.register();
            await ptaxQueueConsumer.register();
        }

        catch {
            await messageBroker.close();
        }
    }

    return { init }
}

type ApplicationBootstrapArgs = {
    providers: {
        /* Other */
        logger: Logger;

        /* Core */
        messageBroker: MessageBroker;

        /* Consumers */
        cmeQueueConsumer: Consumer;
        theNewsQueueConsumer: Consumer;
        ptaxQueueConsumer: Consumer;
    }
}

type ApplicationBootstrap = {
    init(): Promise<void>;
}
