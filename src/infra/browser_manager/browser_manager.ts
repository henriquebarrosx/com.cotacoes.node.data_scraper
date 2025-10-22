export type BrowserManager = {
    launch(): Promise<void>;
    close(): Promise<void>;
    navigate(baseURL: string): Promise<void>,
    evaluate<T>(handler: () => T): Promise<T>;
}
