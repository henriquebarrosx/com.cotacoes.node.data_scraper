export type MessageBrokerQueues = typeof queues[keyof typeof queues];

export const queues = {
	/* PUPPETEER */
	PUPPETEER_DATA_SCRAP: 'puppeteer_data_scrap',

	/* CME */
	CME_DATA_SCRAPER: 'cme_data_scraper',
	CME_DATA_STORE: 'cme_data_store',

	/* PTAX */
	PTAX_DATA_SCRAPER: 'ptax_data_scraper',
	PTAX_DATA_STORE: 'ptax_data_store',

	/* The News */
	THE_NEWS_SCRAPER: 'the_news_data_scraper',
	THE_NEWS_ARTICLE_GENERATION: 'the_news_article_generation',
	THE_NEWS_ARTICLE_STORE: 'the_news_article_store',
} as const