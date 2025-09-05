export class PtaxUrl {
	/** @param isoDate Ex.: 2025-08-19T20:42:44.651Z */
	readonly #isoDate: string;

	constructor(isoDate: string) {
		this.#isoDate = isoDate;
	}

	get value(): string {
		const baseURL = process.env["PTAX_RESOURCE_URL"];
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
		const date = new Date(this.#isoDate);

		const day = String(date.getDate()).padStart(2, '0');
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const year = date.getFullYear();

		return `${day}/${month}/${year}`;
	}
}