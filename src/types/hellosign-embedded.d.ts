declare module 'hellosign-embedded' {
  export type HelloSignConstructorOptions = {
    clientId?: string;
    debug?: boolean;
    locale?: string;
  };

  export type HelloSignOpenOptions = HelloSignConstructorOptions & {
    allowCancel?: boolean;
    skipDomainVerification?: boolean;
    testMode?: boolean;
    allowViewportOverride?: boolean;
    container?: HTMLElement;
    timeout?: number;
  };

  export default class HelloSign {
    static locales: Record<string, string>;

    constructor(options?: HelloSignConstructorOptions);

    open(url: string, options?: HelloSignOpenOptions): void;

    close(): void;

    on(event: string, callback: (...args: unknown[]) => void): this;

    off(event?: string, callback?: (...args: unknown[]) => void): this;
  }
}
