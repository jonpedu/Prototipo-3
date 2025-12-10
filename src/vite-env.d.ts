/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_USE_MOCK: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

// Web Serial API Types
interface SerialPort {
    readonly readable: ReadableStream<Uint8Array>;
    readonly writable: WritableStream<Uint8Array>;
    open(options: SerialOptions): Promise<void>;
    close(): Promise<void>;
}

interface SerialOptions {
    baudRate: number;
    dataBits?: 7 | 8;
    stopBits?: 1 | 2;
    parity?: 'none' | 'even' | 'odd';
    flowControl?: 'none' | 'hardware';
}

interface Serial extends EventTarget {
    requestPort(): Promise<SerialPort>;
    getPorts(): Promise<SerialPort[]>;
}

interface Navigator {
    readonly serial: Serial;
}
