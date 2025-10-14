import type { Page } from 'puppeteer';
import type { CmeRawDTO } from './cme_raw_dto.ts';
import type { Logger } from "../../../infra/logger/logger.ts";
import type { BrowserManagerFacade } from '../../../infra/browser_manager/browser_manager.ts';

export class CmeWorker {

	readonly #logger: Logger;
	readonly #browserManager: BrowserManagerFacade;

	constructor(logger: Logger, browserManager: BrowserManagerFacade) {
		this.#logger = logger;
		this.#browserManager = browserManager;
	}

	async execute() {
		const browserContext = await this.#browserManager.createContext();
		const page = await this.#browserManager.createPageInstance(browserContext);

		try {
			const baseURL = process.env["CME_BASE_URL"];
			if (!baseURL) throw new Error('Cannot proceed cme data scrap: missing cme resource url')

			await this.#browserManager.navigate(page, baseURL);
			const data = await this.scrapData(page);

			return data[0];
		}

		catch (error) {
			if (error instanceof Error) {
				this.#logger.error('[CmeWorker] Cme data scrap failed', error.message);
			}

			throw error;
		}

		finally {
			await page.close();
			await browserContext.close();
			await this.#browserManager.closeBrowser();
		}
	}


	private async scrapData(page: Page): Promise<CmeRawDTO[]> {
		await page.waitForSelector(
			'.main-table-wrapper table tbody tr',
			{ timeout: 30_000 },
		);

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