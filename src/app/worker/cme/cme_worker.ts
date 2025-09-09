import Puppeteer from 'puppeteer-extra';

import { Logger } from "../../../infra/logger/logger.ts";

import type { Browser, Page } from 'puppeteer';
import type { CmeRawDTO } from './cme_raw_dto.ts';

export class CmeWorker {

	readonly #logger: Logger;

	constructor(logger: Logger) {
		this.#logger = logger;
	}

	async execute() {
		let browser: Browser | null = null;

		try {
			const baseURL = process.env["CME_BASE_URL"];
			if (!baseURL) throw new Error('Cannot proceed cme data scrap: missing cme resource url')

			const puppeteerArgs = ['--disable-http2', '--no-sandbox', '--disable-setuid-sandbox'];
			browser = await Puppeteer.launch({ args: puppeteerArgs, headless: true });

			const page = await browser.newPage();
			await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36');
			await page.setJavaScriptEnabled(true);
			await page.setCacheEnabled(false);
			const data = await this.scrapData(page, baseURL);
			await browser.close();

			return data[0];
		}

		catch (error) {
			if (error instanceof Error) {
				this.#logger.error('[CmeWorker] Cme data scrap failed', error.message);
			}

			if (browser) {
				this.#logger.info('[CmeWorker] Closing browser after failure');
				await browser.close();
			}

			throw error;
		}
	}


	private async scrapData(page: Page, baseURL: string): Promise<CmeRawDTO[]> {
		await page.goto(
			baseURL,
			{
				waitUntil: 'domcontentloaded',
				timeout: 60000,
			}
		);

		await page.waitForSelector('.main-table-wrapper table tbody tr');

		const data = await page.evaluate(() => {
			// @ts-ignore: it only exist at browser-side
			const rows = document.querySelectorAll('.main-table-wrapper table tbody tr');
			const data: CmeRawDTO[] = [];

			rows.forEach((row) => {
				const columns = row.querySelectorAll('td');

				const params = {
					last: columns[3].innerText.trim(),
					change: columns[4].innerText.trim(),
					high: columns[7].innerText.trim(),
					low: columns[8].innerText.trim(),
					volume: columns[9].innerText.trim(),
					updated: columns[10].innerText.trim()
				};

				const notEmpty = Object.values(params).every(value => !!value);
				if (notEmpty) data.push(params);
			});

			return data.slice(0, 1);
		});

		return data;
	}
}