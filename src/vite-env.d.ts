/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_USE_MOCK: string
    readonly VITE_SERIAL_BAUDRATE: string
    readonly VITE_TELEMETRY_INTERVAL: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
