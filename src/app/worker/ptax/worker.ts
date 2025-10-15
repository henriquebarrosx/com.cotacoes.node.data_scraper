import { type Page } from 'puppeteer';

import { PtaxUrl } from '../../domain/ptax_url.ts';

import { type AppWorker } from '../worker.ts';
import { type RawPtaxDTO } from '../../dto/raw_ptax_dto.ts';
import { type Logger } from "../../../infra/logger/logger.ts";
import { type BrowserManagerFacade } from '../../../infra/browser_manager/browser_manager.ts';

export function createPtaxWorker({ providers }: PtaxWorkerArgs): AppWorker<(RawPtaxDTO & { date: string })[]> {
	const { logger, browserManager } = providers;

	async function execute(fromDate: string): Promise<(RawPtaxDTO & { date: string })[]> {
		logger.info(`[PtaxWorker] Scrapping ptax data at date: ${fromDate}`);

		const browserContext = await browserManager.createContext();
		const page = await browserManager.createPageInstance(browserContext);

		try {
			const baseURL = new PtaxUrl(fromDate);
			await browserManager.navigate(page, baseURL.value);
			const data = await scrapData(page);
			return data.map((params) => ({ ...params, date: fromDate }));
		}

		catch (error) {
			if (error instanceof Error) {
				logger.error(`[PtaxWorker] Ptax data scrap failed at date: ${fromDate}`, error.message);
			}

			throw error;
		}

		finally {
			await page.close();
			await browserContext.close();
			await browserManager.closeBrowser();
		}
	}


	async function scrapData(page: Page): Promise<RawPtaxDTO[]> {
		await page.waitForSelector('table.tabela tbody tr');

		const data = await page.evaluate(() => {
			// @ts-ignore: it only exist at browser-side
			const rows = document.querySelectorAll('table.tabela tbody tr');
			const data: RawPtaxDTO[] = [];

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

	return {
		execute,
	}
}

type PtaxWorkerArgs = {
	providers: {
		logger: Logger;
		browserManager: BrowserManagerFacade;
	}
}