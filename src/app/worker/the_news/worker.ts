import { TheNewsUrl } from '../../domain/the_news_url.ts';

import { type AppWorker } from '../worker.ts';
import { type Logger } from "../../../infra/logger/logger.ts";
import { type BrowserManager } from '../../../infra/browser_manager/browser_manager.ts';

export function createTheNewsWorker({ providers }: TheNewsWorkerArgs): AppWorker<string> {
	const { logger, browserManager } = providers;

	async function execute(fromDate: string): Promise<string> {
		try {
			logger.info(`[TheNewsWorker] Scrapping the news data at date: ${fromDate}`);
			await browserManager.launch();

			const baseURL = new TheNewsUrl(fromDate).value;
			await browserManager.navigate(baseURL);
			const data = await scrapData(baseURL);

			return data;
		}

		catch (error) {
			if (error instanceof Error) {
				logger.error(`[TheNewsWorker] TheNews data scrap failed at date: ${fromDate}`, error.message);
			}

			throw error;
		}

		finally {
			await browserManager.close();
		}
	}

	async function scrapData(url: string): Promise<string> {
		let content = '';

		const links = await browserManager.evaluate<string[]>(() => {
			const container = document.querySelectorAll('div.grid div');
			const elements = Array.from(container);

			const links = elements.reduce((acc, element) => {
				const anchor: HTMLAnchorElement | null = element
					.querySelector('a[data-discover="true"]');

				if (!anchor) return acc;

				const matchesArticleLink = anchor.href
					.includes(`${location.origin}/p/`);

				if (!matchesArticleLink) return acc;

				acc.add(anchor.href);
				return acc;
			}, new Set<string>())

			return Array.from(links);
		});

		for await (const link of links) {
			await browserManager.navigate(link);

			const text = await browserManager.evaluate<string>(() => {
				const container = document.getElementById('content-blocks');
				if (!container) return '';

				const elements = Array.from(container.children).filter(el => el.tagName === 'DIV');
				const textContent = elements.map(el => el.textContent?.trim() || '');
				const nonEmpty = textContent.filter(t => t !== '');
				return nonEmpty.join('\n');
			});

			content += text;
		}

		return content;
	}

	return {
		execute,
	}
}

type TheNewsWorkerArgs = {
	providers: {
		logger: Logger;
		browserManager: BrowserManager;
	}
}