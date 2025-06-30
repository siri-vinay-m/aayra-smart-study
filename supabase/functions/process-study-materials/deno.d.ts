// Deno type declarations for TypeScript

// Global Deno namespace declaration
declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    delete(key: string): void;
    has(key: string): boolean;
    toObject(): Record<string, string>;
  }

  export const env: Env;

  export interface Addr {
    transport: "tcp" | "udp";
    hostname: string;
    port: number;
  }

  export interface ListenOptions {
    port?: number;
    hostname?: string;
    transport?: "tcp";
  }

  export interface Listener {
    addr: Addr;
    rid: number;
    accept(): Promise<Conn>;
    close(): void;
    [Symbol.asyncIterator](): AsyncIterableIterator<Conn>;
  }

  export interface Conn {
    rid: number;
    localAddr: Addr;
    remoteAddr: Addr;
    read(p: Uint8Array): Promise<number | null>;
    write(p: Uint8Array): Promise<number>;
    close(): void;
    closeWrite(): Promise<void>;
    readable: ReadableStream<Uint8Array>;
    writable: WritableStream<Uint8Array>;
  }

  export interface HttpConn {
    rid: number;
    nextRequest(): Promise<RequestEvent | null>;
    close(): void;
  }

  export interface RequestEvent {
    request: Request;
    respondWith(r: Response | Promise<Response>): Promise<void>;
  }

  export function listen(options: ListenOptions): Listener;
  export function serveHttp(conn: Conn): HttpConn;

  export namespace errors {
    export class Http extends Error {
      constructor(message?: string);
    }
  }
}

// HTTP Server module declarations
declare module "https://deno.land/std@0.193.0/http/server.ts" {
  export interface ConnInfo {
    readonly localAddr: Deno.Addr;
    readonly remoteAddr: Deno.Addr;
  }

  export type Handler = (
    request: Request,
    connInfo: ConnInfo,
  ) => Response | Promise<Response>;

  export interface ServerInit extends Partial<Deno.ListenOptions> {
    handler: Handler;
    onError?: (error: unknown) => Response | Promise<Response>;
  }

  export class Server {
    constructor(serverInit: ServerInit);
    serve(listener: Deno.Listener): Promise<void>;
    listenAndServe(): Promise<void>;
    close(): void;
  }

  export function serve(handler: Handler, options?: Partial<Deno.ListenOptions>): Promise<void>;
}

// Make this file a module
export {};