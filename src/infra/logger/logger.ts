export class Logger {
	info(message: string, ...args: unknown[]): void {
		console.log(`INFO (${this.getFormattedDateTime()}): ${message}`, ...args);
	}

	error(message: string, ...args: unknown[]): void {
		console.error(`ERROR (${this.getFormattedDateTime()}): ${message}`, ...args);
	}

	private getFormattedDateTime(): string {
		function addZeroAtBeginWhenLessThan10(number: number) {
			return number.toString().padStart(2, '0');
		}

		const date = new Date();

		const day = addZeroAtBeginWhenLessThan10(date.getDate());
		const month = addZeroAtBeginWhenLessThan10(date.getMonth() + 1);
		const year = date.getFullYear();

		const hours = addZeroAtBeginWhenLessThan10(date.getHours());
		const minutes = addZeroAtBeginWhenLessThan10(date.getMinutes());
		const seconds = addZeroAtBeginWhenLessThan10(date.getSeconds());

		return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
	}
}