export type AppWorker<T> = {
	execute(args?: unknown): Promise<T>;
}