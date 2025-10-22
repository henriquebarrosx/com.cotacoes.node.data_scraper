export type BrowserManager = {
    launch(): Promise<void>;
    closeBrowser(): Promise<void>;
    navigate(baseURL: string): Promise<void>,
    evaluate<T>(handler: () => T): Promise<T>;
}
