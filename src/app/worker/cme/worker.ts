import { type AppWorker } from '../worker.ts';
import { type RawCmeDTO } from '../../dto/raw_cme_dto.ts';
import { type Logger } from "../../../infra/logger/logger.ts";
import { type BrowserManager } from '../../../infra/browser_manager/browser_manager.ts';

export function createCmeWorker({ providers }: CmeWorkerArgs): AppWorker<RawCmeDTO> {
	const { logger, browserManager } = providers;

	async function execute(): Promise<RawCmeDTO> {
		try {
			const baseURL = process.env["CME_BASE_URL"];
			if (!baseURL) throw new Error('Cannot proceed cme data scrap: cme resource url not found')

			await browserManager.launch();
			await browserManager.navigate(baseURL);
			const data = await processCmeDataExtraction();

			const firstRow = data[0];
			if (!firstRow) throw new Error('Failed to extract CME data: the source is empty or does not contain valid information for extraction.')

			return firstRow;
		}

		catch (error) {
			if (error instanceof Error) {
				logger.error('[CmeWorker] Cme data scrap failed: ', error.message);
			}

			throw error;
		}

		finally {
			await browserManager.close();
		}
	}

	async function processCmeDataExtraction(): Promise<RawCmeDTO[]> {
		return await browserManager.evaluate<RawCmeDTO[]>(() => {
			const rows = document.querySelectorAll('.main-table-wrapper table tbody tr');
			const rawDatas: RawCmeDTO[] = [];

			for (const row of rows) {
				const rawData = extractRawDataFromRow(row);
				const isEmpty = isEmptyRow(rawData);
				if (isEmpty) continue

				rawDatas.push(rawData);
			}

			function isEmptyRow(result: RawCmeDTO): boolean {
				return Object.values(result)
					.some(value => !value || value === '-');
			}

			function extractRawDataFromRow(row: Element): RawCmeDTO {
				const columns = row.querySelectorAll('td');

				const [
					_month,
					_options,
					_chart,
					last,
					change,
					_priorSettle,
					_open,
					high,
					low,
					volume,
					updated
				] = columns;

				const params: RawCmeDTO = {
					last: last.innerText.trim(),
					change: change.innerText.trim(),
					high: high.innerText.trim(),
					low: low.innerText.trim(),
					volume: volume.innerText.trim(),
					updated: updated.innerText.trim()
				};

				return params;
			}

			return rawDatas;
		});
	}

	return {
		execute,
	}
}

type CmeWorkerArgs = {
	providers: {
		logger: Logger;
		browserManager: BrowserManager;
	}
}