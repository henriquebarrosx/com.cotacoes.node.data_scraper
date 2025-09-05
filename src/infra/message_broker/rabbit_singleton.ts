import { logger } from "../logger/index.ts";
import { RabbitMQFacade } from "./rabbit_facade.ts";

export class RabbitMQSingleton {
	private static instance: RabbitMQFacade;

	private constructor() { }

	public static getInstance() {
		if (!RabbitMQSingleton.instance) {
			RabbitMQSingleton.instance = new RabbitMQFacade(logger);
		}

		return RabbitMQSingleton.instance;
	}
}