import Puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

import { PtaxUrl } from './ptax_url.ts';
import { Logger } from "../../../infra/logger/logger.ts";

import type { Browser, Page } from 'puppeteer';
import type { PtaxRawDTO } from './ptax_raw_dto.ts';

export type PtaxInput = {
	fromDate: string;
}

export class PtaxWorker {

	private readonly logger: Logger;

	constructor(logger: Logger) {
		this.logger = logger;
	}

	async execute(fromDate: string) {
		let browser: Browser | null = null;

		try {
			this.logger.info(`[PtaxWorker] Scrapping ptax data at date: ${fromDate}`);

			Puppeteer.use(StealthPlugin());

			const puppeteerArgs = ['--disable-http2', '--no-sandbox', '--disable-setuid-sandbox'];
			browser = await Puppeteer.launch({ args: puppeteerArgs, headless: true });

			const page = await browser.newPage();
			await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36');
			await page.setJavaScriptEnabled(true);
			await page.setCacheEnabled(false);
			const data = await this.scrapData(fromDate, page);
			await browser.close();

			return data.map((params) => ({ ...params, date: fromDate }));
		}

		catch (error) {
			if (error instanceof Error) {
				this.logger.error(`[PtaxWorker] Ptax data scrap failed at date: ${fromDate}`, error.message);
			}

			if (browser) {
				this.logger.info('[PtaxWorker] Closing browser after failure');
				await browser.close();
			}

			throw error;
		}
	}


	private async scrapData(fromDate: string, page: Page): Promise<PtaxRawDTO[]> {
		const baseURL = new PtaxUrl(fromDate);

		await page.goto(
			baseURL.value,
			{
				waitUntil: 'domcontentloaded',
				timeout: 60000,
			}
		);

		await page.waitForSelector('table.tabela tbody tr');

		const data = await page.evaluate(() => {
			// @ts-ignore: it only exist at browser-side
			const rows = document.querySelectorAll('table.tabela tbody tr');
			const data: PtaxRawDTO[] = [];

			for (const row of rows) {
				const MIN_AMOUNT_OF_COLUMNS_REQUIRED = 6;
				const columns = row.querySelectorAll("td");

				if (columns.length < MIN_AMOUNT_OF_COLUMNS_REQUIRED) continue;

				const params = {
					time: columns[0].innerText.trim(),
					type: columns[1].innerText.trim(),
					buyRateValue: columns[2].innerText.trim(),
					sellRateValue: columns[3].innerText.trim(),
				};

				data.push(params);
			}

			return data;
		});

		return data;
	}
}