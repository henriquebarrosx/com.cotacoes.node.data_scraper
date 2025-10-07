import Puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

import type { Browser, BrowserContext, Page } from 'puppeteer';
import type { Logger } from '../logger/logger.ts';

import { logger } from '../logger/index.ts';

type WaitUntil =
	| 'networkidle0'		/* Waits for no more than 0 network connections for at least 500 ms. */
	| 'networkidle2'		/* Waits for no more than 2 network connections for at least 500 ms. */
	| 'load'				/* Waits for the load event to fire. */
	| 'domcontentloaded'	/* Waits for the DOMContentLoaded event to fire. */

export class BrowserManagerFacade {
	private static instance: BrowserManagerFacade;

	readonly #logger: Logger;

	#browser: Browser | null = null;
	#closeEventTimeout: NodeJS.Timeout | null = null;

	private constructor(logger: Logger) {
		this.#logger = logger;
	}

	static getInstance() {
		if (!BrowserManagerFacade.instance) {
			BrowserManagerFacade.instance = new BrowserManagerFacade(logger);
		}

		return BrowserManagerFacade.instance;
	}

	async launch() {
		this.#logger.info("[BrowserManagerFacade] — Launching new browser");

		if (this.#browser) {
			this.#logger.info("[BrowserManagerFacade] — Browser already Launched");
			return;
		}

		this.skipScheduledBrowserClosure();

		Puppeteer.use(StealthPlugin());
		const puppeteerArgs = ['--disable-http2', '--no-sandbox', '--disable-setuid-sandbox'];
		this.#browser = await Puppeteer.launch({ args: puppeteerArgs, headless: true });

		this.setupGracefulShutdown();

		this.#logger.info("[BrowserManagerFacade] — Browser launched successfully");
	}

	/**
	 * Ensure the browser is periodically restarted to avoid long-lived Chromium 
	 * processes that accumulate pages/listeners and cause resource leaks or instability.
	*/
	private skipScheduledBrowserClosure(): void {
		if (this.#closeEventTimeout) {
			this.#logger.info("[BrowserManagerFacade] — Skipping scheduled browser closure");
			clearTimeout(this.#closeEventTimeout);
		}

		this.setupBrowserClosureScheduler();
	}

	private setupBrowserClosureScheduler(): void {
		const FIVE_MINUTES_IN_MILLISECONDS = 300_000;

		this.#closeEventTimeout = setTimeout(async () => {
			await this.closeBrowser();
		}, FIVE_MINUTES_IN_MILLISECONDS);
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

	async closeBrowser() {
		this.#logger.info("[BrowserManagerFacade] — Closing browser");

		if (!this.#browser) {
			throw new Error('Cannot close browser: browser not launched');
		}

		await this.#browser.close();
	}

	async createContext(): Promise<BrowserContext> {
		this.#logger.info("[BrowserManagerFacade] — Creating new browser context");

		if (this.#browser) {
			return await this.#browser.createBrowserContext();
		}

		await this.launch();
		return this.createContext();
	}

	async createPageInstance(context: BrowserContext): Promise<Page> {
		this.#logger.info("[BrowserManagerFacade] — Creating new browser page instance");

		if (!this.#browser) {
			throw new Error('Browser context creation failed: browser not launched');
		}

		const page = await context.newPage();
		await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36');
		await page.setJavaScriptEnabled(true);
		await page.setCacheEnabled(false);

		return page;
	}

	async navigate(pageInstance: Page, baseURL: string): Promise<void> {
		this.#logger.info(`[BrowserManagerFacade] — Navigating to page '${baseURL}'`);
		this.skipScheduledBrowserClosure();

		const waitUntil: WaitUntil = 'domcontentloaded';

		await pageInstance.goto(
			baseURL,
			{
				waitUntil: waitUntil,
				timeout: 60000,
			}
		);
	}

}