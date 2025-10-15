import type { Page } from 'puppeteer';

import { type AppWorker } from '../worker.ts';
import { type RawCmeDTO } from '../../dto/raw_cme_dto.ts';
import { type Logger } from "../../../infra/logger/logger.ts";
import { type BrowserManagerFacade } from '../../../infra/browser_manager/browser_manager.ts';

export function createCmeWorker({ providers }: CmeWorkerArgs): AppWorker<RawCmeDTO> {
	const { logger, browserManager } = providers;

	async function execute(): Promise<RawCmeDTO> {
		const browserContext = await browserManager.createContext();
		const page = await browserManager.createPageInstance(browserContext);

		try {
			const baseURL = process.env["CME_BASE_URL"];
			if (!baseURL) throw new Error('Cannot proceed cme data scrap: missing cme resource url')

			await browserManager.navigate(page, baseURL);
			const data = await scrapData(page);

			return data[0];
		}

		catch (error) {
			if (error instanceof Error) {
				logger.error('[CmeWorker] Cme data scrap failed', error.message);
			}

			throw error;
		}

		finally {
			await page.close();
			await browserContext.close();
			await browserManager.closeBrowser();
		}
	}

	async function scrapData(page: Page): Promise<RawCmeDTO[]> {
		await page.waitForSelector(
			'.main-table-wrapper table tbody tr',
			{ timeout: 30_000 },
		);

		const data = await page.evaluate(() => {
			// @ts-ignore: it only exist at browser-side
			const rows = document.querySelectorAll('.main-table-wrapper table tbody tr');
			const data: RawCmeDTO[] = [];

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

	return {
		execute,
	}
}

type CmeWorkerArgs = {
	providers: {
		logger: Logger;
		browserManager: BrowserManagerFacade;
	}
}