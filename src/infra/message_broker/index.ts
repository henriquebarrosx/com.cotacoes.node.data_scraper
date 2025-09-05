import { RabbitMQSingleton } from "./rabbit_singleton.ts";

export const messageBroker = RabbitMQSingleton.getInstance();
