export function createLogger(): Logger {
	function info(message: string, ...args: unknown[]): void {
		console.log(`INFO (${getFormattedDateTime()}): ${message}\n`, ...args);
	}

	function error(message: string, ...args: unknown[]): void {
		console.error(`ERROR (${getFormattedDateTime()}): ${message}`, ...args);
	}

	function getFormattedDateTime(): string {
		const date = new Date();

		const day = addZeroAtBeginWhenLessThan10(date.getDate());
		const month = addZeroAtBeginWhenLessThan10(date.getMonth() + 1);
		const year = date.getFullYear();

		const hours = addZeroAtBeginWhenLessThan10(date.getHours());
		const minutes = addZeroAtBeginWhenLessThan10(date.getMinutes());
		const seconds = addZeroAtBeginWhenLessThan10(date.getSeconds());

		return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
	}

	function addZeroAtBeginWhenLessThan10(number: number): string {
		return number.toString().padStart(2, '0');
	}

	return {
		info,
		error,
	}

}

export type Logger = {
	info(message: string, ...args: unknown[]): void;
	error(message: string, ...args: unknown[]): void;
}