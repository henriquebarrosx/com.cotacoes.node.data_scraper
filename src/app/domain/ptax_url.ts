export class PtaxUrl {
	readonly #date: string;

	/** @param date Ex.: 2025-08-19T20:42:44.651Z or 2025-08-19 */
	constructor(date: string) {
		this.#date = date;
	}

	get value(): string {
		const baseURL = process.env["PTAX_BASE_URL"];
		if (!baseURL) throw new Error('Cannot build ptax url: missing ptax resource url');

		const TRADED_EXCHANGE_RATES_REPORT_OPTION = "3";
		const EUA_DOLLAR_CURRENCY_IDENTIFICATION = "61";

		const searchParams = new URLSearchParams();
		searchParams.append('method', "consultarBoletim");
		searchParams.append('DATAINI', this.#getDateFormat());
		searchParams.append('RadOpcao', TRADED_EXCHANGE_RATES_REPORT_OPTION);
		searchParams.append('ChkMoeda', EUA_DOLLAR_CURRENCY_IDENTIFICATION);

		return `${baseURL}?${searchParams.toString()}`;
	}

	#getDateFormat() {
		const DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3}Z)?)?$/;
		const isValidDate = DATE_REGEX.test(this.#date);

		if (!isValidDate) {
			throw new Error('Cannot serialize date: invalid format (expect: "2025-08-19T20:42:44.651Z", or "2025-08-19T20:42:44.651Z" or "2025-08-19")')
		}

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