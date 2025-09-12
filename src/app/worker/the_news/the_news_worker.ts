import { TheNewsUrl } from './the_news_url.ts';

import type { Page } from 'puppeteer';
import type { Logger } from "../../../infra/logger/logger.ts";
import type { BrowserManagerFacade } from '../../../infra/browser_manager/browser_manager.ts';

export type TheNewsInput = {
	fromDate: string;
}

export class TheNewsWorker {

	readonly #logger: Logger;
	readonly #browserManager: BrowserManagerFacade;

	constructor(logger: Logger, browserManager: BrowserManagerFacade) {
		this.#logger = logger;
		this.#browserManager = browserManager;
	}

	async execute(fromDate: string) {
		this.#logger.info(`[PtaxWorker] Scrapping TheNews data at date: ${fromDate}`);

		const browserContext = await this.#browserManager.createContext();
		const page = await this.#browserManager.createPageInstance(browserContext);

		try {
			const baseURL = new TheNewsUrl(fromDate);
			await this.#browserManager.navigate(page, baseURL.value);
			const data = await this.scrapData(page);
			return data;
		}

		catch (error) {
			if (error instanceof Error) {
				this.#logger.error(`[TheNewsWorker] TheNews data scrap failed at date: ${fromDate}`, error.message);
			}

			throw error;
		}

		finally {
			await page.close();
			await browserContext.close();
		}
	}

	private async scrapData(page: Page): Promise<string> {
		const links = await page.evaluate(() => {
			const container = document.querySelectorAll('div.grid div');

			const paths = Array.from(container)
				.filter((el) => {
					const isAnchor = el.querySelector('a[data-discover="true"]');
					return isAnchor;
				})
				.filter((el) => {
					// @ts-ignore: it only exist at browser-side
					const anchor = el.querySelector('a[data-discover="true"]').href
					return anchor.includes(`${location.origin}/p/`)
				})
				.reduce<Set<string>>((items, el) => {
					const anchor = el.querySelector('a[data-discover="true"]') as HTMLAnchorElement;
					items.add(anchor.href);
					return items;
				}, new Set<string>())

			return Array.from(paths);
		});

		let content = '';

		for await (const link of links) {
			await this.#browserManager.navigate(page, link);

			const text = await page.evaluate(() => {
				// @ts-ignore: it only exist at browser-side
				const elements = document.getElementById('content-blocks').children;
				// @ts-ignore: it only exist at browser-side
				const contentElements = Array.from(elements).filter((el) => el.tagName === 'DIV');
				// @ts-ignore: it only exist at browser-side
				const textContent = contentElements.map(el => el.textContent);
				const nonEmptyContent = textContent.filter(text => text.trim() !== '');
				return nonEmptyContent.join('\n');
			});

			content = text;
		}

		return content;
	}

}