import Puppeteer from 'puppeteer-extra';

import { TheNewsUrl } from './the_news_url.ts';

import type { Browser, Page } from 'puppeteer';
import type { Logger } from "../../../infra/logger/logger.ts";

export type TheNewsInput = {
	fromDate: string;
}

export class TheNewsWorker {

	readonly #logger: Logger;

	constructor(logger: Logger) {
		this.#logger = logger;
	}

	async execute(fromDate: string) {
		let browser: Browser | null = null;

		try {
			this.#logger.info(`[PtaxWorker] Scrapping TheNews data at date: ${fromDate}`);

			const puppeteerArgs = ['--disable-http2', '--no-sandbox', '--disable-setuid-sandbox'];
			browser = await Puppeteer.launch({ args: puppeteerArgs, headless: true });

			const page = await browser.newPage();
			await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36');
			await page.setJavaScriptEnabled(true);
			await page.setCacheEnabled(false);
			const data = await this.scrapData(fromDate, page);
			await browser.close();

			return data;
		}

		catch (error) {
			if (error instanceof Error) {
				this.#logger.error(`[TheNewsWorker] TheNews data scrap failed at date: ${fromDate}`, error.message);
			}

			if (browser) {
				this.#logger.info('[TheNewsWorker] Closing browser after failure');
				await browser.close();
			}

			throw error;
		}
	}

	private async scrapData(fromDate: string, page: Page): Promise<string> {
		const baseURL = new TheNewsUrl(fromDate);

		await page.goto(
			baseURL.value,
			{
				waitUntil: 'domcontentloaded',
				timeout: 60000,
			}
		);

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
			await page.goto(link, {
				waitUntil: 'networkidle2',
				timeout: 60000
			});

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