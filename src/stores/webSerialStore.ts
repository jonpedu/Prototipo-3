import { create } from 'zustand';
import type { SerialConnectionState, TelemetryData, MockSerialConfig } from '../types';

// ============================================================================
// WEB SERIAL STORE - Gerencia comunicação serial e telemetria
// ============================================================================

interface WebSerialState {
    // Connection State
    connection: SerialConnectionState;

    // Telemetry
    telemetryData: TelemetryData[];
    maxTelemetryEntries: number;

    // Mock Mode
    mockConfig: MockSerialConfig;

    // Actions
    setConnected: (isConnected: boolean, portInfo?: any) => void;
    setUploading: (isUploading: boolean, progress?: number) => void;
    setError: (error: string | undefined) => void;
    addTelemetryData: (data: TelemetryData) => void;
    clearTelemetry: () => void;
    setMockMode: (enabled: boolean) => void;
    resetConnection: () => void;
}

const DEFAULT_MOCK_CONFIG: MockSerialConfig = {
    enabled: import.meta.env.VITE_USE_MOCK === 'true',
    telemetryInterval: parseInt(import.meta.env.VITE_TELEMETRY_INTERVAL || '1000'),
    simulateErrors: false,
    simulateLatency: true,
};

export const useWebSerialStore = create<WebSerialState>((set, get) => ({
    // Estado inicial
    connection: {
        isConnected: false,
        isUploading: false,
        uploadProgress: 0,
        portInfo: undefined,
        lastError: undefined,
    },

    telemetryData: [],
    maxTelemetryEntries: 1000,

    mockConfig: DEFAULT_MOCK_CONFIG,

    // Actions
    setConnected: (isConnected, portInfo) => {
        set((state) => ({
            connection: {
                ...state.connection,
                isConnected,
                portInfo,
                lastError: undefined,
            },
        }));
    },

    setUploading: (isUploading, progress = 0) => {
        set((state) => ({
            connection: {
                ...state.connection,
                isUploading,
                uploadProgress: progress,
            },
        }));
    },

    setError: (error) => {
        set((state) => ({
            connection: {
                ...state.connection,
                lastError: error,
            },
        }));
    },

    addTelemetryData: (data) => {
        set((state) => {
            const newData = [...state.telemetryData, data];
            // Limitar número de entradas para evitar uso excessivo de memória
            if (newData.length > state.maxTelemetryEntries) {
                newData.shift();
            }
            return { telemetryData: newData };
        });
    },

    clearTelemetry: () => {
        set({ telemetryData: [] });
    },

    setMockMode: (enabled) => {
        set((state) => ({
            mockConfig: {
                ...state.mockConfig,
                enabled,
            },
        }));
    },

    resetConnection: () => {
        set({
            connection: {
                isConnected: false,
                isUploading: false,
                uploadProgress: 0,
                portInfo: undefined,
                lastError: undefined,
            },
        });
    },
}));
