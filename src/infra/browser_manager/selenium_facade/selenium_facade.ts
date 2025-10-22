import os from 'os';
import fs from 'fs';
import path from 'path';
import Chrome from 'selenium-webdriver/chrome.js';
import { Browser, Builder, type WebDriver } from 'selenium-webdriver';

import { type Logger } from '../../logger/logger.ts';
import { type BrowserManager } from '../browser_manager.ts';

/**
 * Repositório: 
 * https://www.npmjs.com/package/selenium-webdriver
 * https://www.selenium.dev/documentation
 */
export function createSeleniumFacade({ providers }: SeleniumFacadeArgs): BrowserManager {
    const { logger } = providers;

    const serverURL: string = "http://selenium:4444/wd/hub";
    let webDriver: WebDriver | null = null;

    async function launch(): Promise<void> {
        logger.info("[SeleniumFacade] — Launching new web driver instance");

        if (webDriver) {
            logger.info("[SeleniumFacade] — Web driver already Launched");
            return;
        }

        const options = new Chrome.Options()
            .addArguments(
                '--headless',
                '--disable-http2',
                '--no-sandbox',
                '--incognito',
                '--disable-gpu',
                '--disk-cache-size=0',
                '--disable-cache',
                '--disable-dev-shm-usage',
                '--disable-software-rasterizer',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                createNewSessionArg(),
            )
            .setBrowserVersion("stable")

        webDriver = await new Builder()
            .forBrowser(Browser.CHROME)
            .setChromeOptions(options as unknown as Chrome.Options)
            .usingServer(serverURL)
            .setChromeService(new Chrome.ServiceBuilder())
            .build();

        await webDriver.manage()
            .setTimeouts({ pageLoad: 60_000 });

        setupGracefulShutdown();
        logger.info("[SeleniumFacade] — Web driver launched successfully");
    }

    function createNewSessionArg(): string {
        const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-profile-'));
        return `--user-data-dir=${userDataDir}`
    }

    async function close(): Promise<void> {
        if (!webDriver) return

        logger.info("[SeleniumFacade] — Closing Web driver");

        await webDriver.close();
        await webDriver.quit();
        webDriver = null;
    }

    function setupGracefulShutdown() {
        /**
         * Interrupt:
         * Enviado quando o usuário aperta Ctrl +C no terminal para interromper o processo.
        */
        process.once('SIGINT', async () => {
            await close();
            process.exit(1);
        });

        /**
         * Terminate:
         * Pedido “educado” para encerrar. Usado por sistemas de orquestração
         * (ex.: Docker, Kubernetes) para desligar um serviço.
        */
        process.once('SIGTERM', async () => {
            await close();
            process.exit(1);
        });

        /**
         * User-defined signal 2:
         * Sinal “livre” para uso da aplicação. O Node usa em alguns cenários,
         * como reinício em depuração (node --inspect).
        */
        process.once('SIGUSR2', async () => {
            await close();
            process.kill(process.pid, 'SIGUSR2');
            process.exit(1);
        });

        /**
         * Hang up:
         * Originalmente perda de conexão de terminal. Hoje é usado para indicar
         * que o processo deve recarregar configuração ou reiniciar.
        */
        process.once('SIGHUP', async () => {
            await close();
            process.exit(1);
        });
    }

    async function navigate(baseURL: string): Promise<void> {
        logger.info(`[SeleniumFacade] — Navigating to page '${baseURL}'`);
        if (webDriver) await webDriver.get(baseURL);
    }

    async function evaluate<T>(handler: () => T): Promise<T> {
        if (!webDriver) throw new Error('Cannot evaluate page: web driver not found');
        return await webDriver.executeScript(handler)
    }

    return {
        launch,
        close,
        navigate,
        evaluate,
    }
}

type SeleniumFacadeArgs = {
    providers: {
        logger: Logger;
    }
}
