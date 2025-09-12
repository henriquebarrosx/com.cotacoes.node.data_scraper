import { PtaxUrl } from './ptax_url.ts';

import type { Page } from 'puppeteer';
import type { PtaxRawDTO } from './ptax_raw_dto.ts';
import type { Logger } from "../../../infra/logger/logger.ts";
import type { BrowserManagerFacade } from '../../../infra/browser_manager/browser_manager.ts';

export type PtaxInput = {
	fromDate: string;
}

export class PtaxWorker {

	readonly #logger: Logger;
	readonly #browserManager: BrowserManagerFacade;

	constructor(logger: Logger, browserManager: BrowserManagerFacade) {
		this.#logger = logger;
		this.#browserManager = browserManager;
	}

	async execute(fromDate: string) {
		this.#logger.info(`[PtaxWorker] Scrapping ptax data at date: ${fromDate}`);

		const browserContext = await this.#browserManager.createContext();
		const page = await this.#browserManager.createPageInstance(browserContext);

		try {
			const baseURL = new PtaxUrl(fromDate);
			await this.#browserManager.navigate(page, baseURL.value);
			const data = await this.scrapData(page);
			return data.map((params) => ({ ...params, date: fromDate }));
		}

		catch (error) {
			if (error instanceof Error) {
				this.#logger.error(`[PtaxWorker] Ptax data scrap failed at date: ${fromDate}`, error.message);
			}

			throw error;
		}

		finally {
			await page.close();
			await browserContext.close();
		}
	}


	private async scrapData(page: Page): Promise<PtaxRawDTO[]> {
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