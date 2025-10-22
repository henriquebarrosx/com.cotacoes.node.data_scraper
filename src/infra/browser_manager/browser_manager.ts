import os from 'os';
import fs from 'fs';
import path from 'path';
import Chrome from 'selenium-webdriver/chrome.js';
import { Browser, Builder, type WebDriver } from 'selenium-webdriver';

import type { Logger } from '../logger/logger.ts';


export class BrowserManagerFacade {
    readonly #logger: Logger;

    #webDriver: WebDriver | null = null;
    readonly #serverURL: string = "http://selenium:4444/wd/hub";

    constructor(logger: Logger) {
        this.#logger = logger;
    }

    async launch() {
        this.#logger.info("[BrowserManagerFacade] — Launching new browser");

        if (this.#webDriver) {
            this.#logger.info("[BrowserManagerFacade] — Browser already Launched");
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
                this.createNewSessionArg(),
            )
            .setBrowserVersion("stable")

        this.#webDriver = await new Builder()
            .forBrowser(Browser.CHROME)
            .setChromeOptions(options as unknown as Chrome.Options)
            .usingServer(this.#serverURL)
            .setChromeService(new Chrome.ServiceBuilder())
            .build();

        await this.#webDriver.manage()
            .setTimeouts({ pageLoad: 60_000 });

        this.setupGracefulShutdown();
        this.#logger.info("[BrowserManagerFacade] — Browser launched successfully");
    }

    private createNewSessionArg(): string {
        const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-profile-'));
        return `--user-data-dir=${userDataDir}`
    }

    async closeBrowser() {
        if (!this.#webDriver) return

        this.#logger.info("[BrowserManagerFacade] — Closing browser");

        await this.#webDriver.close();
        await this.#webDriver.quit();
        this.#webDriver = null;
    }

    private setupGracefulShutdown() {
        /**
         * Interrupt:
         * Enviado quando o usuário aperta Ctrl +C no terminal para interromper o processo.
        */
        process.once('SIGINT', async () => {
            await this.closeBrowser();
            process.exit(1);
        });

        /**
         * Terminate:
         * Pedido “educado” para encerrar. Usado por sistemas de orquestração
         * (ex.: Docker, Kubernetes) para desligar um serviço.
        */
        process.once('SIGTERM', async () => {
            await this.closeBrowser();
            process.exit(1);
        });

        /**
         * User-defined signal 2:
         * Sinal “livre” para uso da aplicação. O Node usa em alguns cenários,
         * como reinício em depuração (node --inspect).
        */
        process.once('SIGUSR2', async () => {
            await this.closeBrowser();
            process.kill(process.pid, 'SIGUSR2');
            process.exit(1);
        });

        /**
         * Hang up:
         * Originalmente perda de conexão de terminal. Hoje é usado para indicar
         * que o processo deve recarregar configuração ou reiniciar.
        */
        process.once('SIGHUP', async () => {
            await this.closeBrowser();
            process.exit(1);
        });
    }

    async navigate(baseURL: string): Promise<WebDriver> {
        this.#logger.info(`[BrowserManagerFacade] — Navigating to page '${baseURL}'`);
        if (this.#webDriver) await this.#webDriver.get(baseURL);
        return this.#webDriver!;
    }

    async evaluate<T>(handler: () => T): Promise<T> {
        if (!this.#webDriver) throw new Error('Cannot evaluate page: web driver not found');
        return await this.#webDriver.executeScript(handler)
    }

}
