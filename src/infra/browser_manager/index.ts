import { logger } from "../logger/index.ts";
import { BrowserManagerFacade } from "./browser_manager.ts";

export const browserManager = new BrowserManagerFacade(logger);