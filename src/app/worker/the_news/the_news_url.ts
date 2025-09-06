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
		const zonedDate = this.#isoDate
			.split('T')
			.join('T12:00:00');

		const date = new Date(zonedDate);

		const day = String(date.getDate()).padStart(2, '0');
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const year = date.getFullYear();

		return `${day}/${month}/${year}`;
	}
}