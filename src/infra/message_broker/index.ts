import { logger } from "../logger/index.ts";
import { createRabbitMQFacade } from "./rabbitmq_facade/rabbitmq_facade.ts";

export const messageBroker = createRabbitMQFacade(
	{
		providers: {
			logger: logger
		}
	}
)
