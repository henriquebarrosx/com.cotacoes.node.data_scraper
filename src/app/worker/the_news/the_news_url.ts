export class TheNewsUrl {
	/**
	 * @param isoDate Ex.: 2025-08-19T20:42:44.651Z
	 */
	readonly #isoDate: string;

	constructor(isoDate: string) {
		this.#isoDate = isoDate;
	}

	get value(): string {
		const searchParams = new URLSearchParams();
		searchParams.append('q', this.#getDateFormat());
		return `${this.baseURL}/archive?${searchParams.toString()}`;
	}

	get baseURL() {
		const baseURL = process.env["THE_NEWS_RESOURCE_URL"];
		if (!baseURL) throw new Error('Cannot build the news url: missing the news resource url');
		return baseURL;
	}

	#getDateFormat() {
		const dateFormat = this.#isoDate
			.split('T')
			.slice(0, 1)
			.join('')
			.split('-')
			.reverse()
			.join('/')

		return dateFormat;
	}
}