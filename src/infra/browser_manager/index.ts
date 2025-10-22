import { logger } from "../logger/index.ts";
import { createSeleniumFacade } from "./selenium_facade/selenium_facade.ts";

export const browserManager = createSeleniumFacade(
    {
        providers: {
            logger: logger
        }
    }
)