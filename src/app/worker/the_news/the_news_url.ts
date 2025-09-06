export class TheNewsUrl {
	readonly #date: string;

	/** @param date Ex.: 2025-08-19T20:42:44.651Z or 2025-08-19 */
	constructor(date: string) {
		this.#date = date;
	}

	get value(): string {
		const searchParams = new URLSearchParams();
		searchParams.append('q', this.#getDateFormat());
		return `${this.baseURL}/archive?${searchParams.toString()}`;
	}

	get baseURL() {
		const baseURL = process.env["THE_NEWS_BASE_URL"];
		if (!baseURL) throw new Error('Cannot build the news url: missing the news resource url');
		return baseURL;
	}

	#getDateFormat() {
		const dateFormat = this.#date
			.split('T')
			.slice(0, 1)
			.join('')
			.split('-')
			.reverse()
			.join('/')

		return dateFormat;
	}
}