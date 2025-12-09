import { useEffect, useRef, useCallback } from 'react';
import { useWebSerialStore } from '../stores/webSerialStore';
import { useUIStore } from '../stores/uiStore';
import { parseTelemetryLine, generateMockTelemetry } from '../utils/telemetry-parser';

// ============================================================================
// USE WEB SERIAL - Hook para comunicação serial com Mock Mode
// ============================================================================

interface UseWebSerialReturn {
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    upload: (code: string) => Promise<void>;
    sendCommand: (command: string) => Promise<void>;
    isConnected: boolean;
    isUploading: boolean;
    uploadProgress: number;
    isMockMode: boolean;
}

export function useWebSerial(): UseWebSerialReturn {
    const portRef = useRef<SerialPort | null>(null);
    const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
    const writerRef = useRef<WritableStreamDefaultWriter<Uint8Array> | null>(null);
    const mockIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const { connection, mockConfig, setConnected, setUploading, setError, addTelemetryData } =
        useWebSerialStore();
    const { addNotification } = useUIStore();

    const isMockMode = mockConfig.enabled;

    // ========== Mock Mode ==========

    const connectMock = useCallback(async () => {
        await new Promise((resolve) => setTimeout(resolve, 500)); // Simular latência
        setConnected(true, { mockDevice: true });
        addNotification({
            type: 'success',
            message: '🔌 Conectado ao dispositivo simulado',
        });

        // Iniciar geração de telemetria falsa
        mockIntervalRef.current = setInterval(() => {
            const mockData = generateMockTelemetry();
            const parsed = parseTelemetryLine(mockData);
            addTelemetryData(parsed);
        }, mockConfig.telemetryInterval);
    }, [setConnected, addNotification, addTelemetryData, mockConfig]);

    const disconnectMock = useCallback(async () => {
        if (mockIntervalRef.current) {
            clearInterval(mockIntervalRef.current);
            mockIntervalRef.current = null;
        }
        setConnected(false);
        addNotification({
            type: 'info',
            message: '🔌 Desconectado do dispositivo simulado',
        });
    }, [setConnected, addNotification]);

    const uploadMock = useCallback(
        async (code: string) => {
            addNotification({
                type: 'info',
                message: '🚀 Iniciando upload simulado...',
            });

            setUploading(true, 0);

            // Simular progresso de upload
            for (let i = 0; i <= 100; i += 10) {
                await new Promise((resolve) => setTimeout(resolve, 200));
                setUploading(true, i);
            }

            // Simular logs de sucesso
            console.log('[MOCK] Código enviado:');
            console.log(code);

            addTelemetryData({
                timestamp: Date.now(),
                raw: '[MOCK] Upload concluído com sucesso!',
            });

            addTelemetryData({
                timestamp: Date.now(),
                raw: '[MOCK] ESP32 reiniciando...',
            });

            setUploading(false, 0);

            addNotification({
                type: 'success',
                message: '✅ Upload simulado concluído!',
            });
        },
        [setUploading, addTelemetryData, addNotification]
    );

    const sendCommandMock = useCallback(
        async (command: string) => {
            addTelemetryData({
                timestamp: Date.now(),
                raw: `>>> ${command}`,
            });

            await new Promise((resolve) => setTimeout(resolve, 100));

            addTelemetryData({
                timestamp: Date.now(),
                raw: `[MOCK] Comando recebido: ${command}`,
            });
        },
        [addTelemetryData]
    );

    // ========== Real Web Serial API ==========

    const startReading = useCallback(async () => {
        if (!portRef.current || !portRef.current.readable) return;

        const reader = portRef.current.readable.getReader();
        readerRef.current = reader;

        const decoder = new TextDecoder();
        let buffer = '';

        try {
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Processar linhas completas
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                lines.forEach((line) => {
                    if (line.trim()) {
                        const parsed = parseTelemetryLine(line);
                        addTelemetryData(parsed);
                    }
                });
            }
        } catch (error) {
            console.error('Erro ao ler serial:', error);
        } finally {
            reader.releaseLock();
            readerRef.current = null;
        }
    }, [addTelemetryData]);

    const connectReal = useCallback(async () => {
        if (!('serial' in navigator)) {
            addNotification({
                type: 'error',
                message: '❌ Web Serial API não suportada neste navegador',
            });
            setError('Web Serial API não suportada');
            return;
        }

        try {
            const port = await (navigator as any).serial.requestPort();
            await port.open({ baudRate: 115200 });

            portRef.current = port;
            setConnected(true, { port });

            addNotification({
                type: 'success',
                message: '🔌 Conectado ao ESP32',
            });

            // Iniciar leitura
            startReading();
        } catch (error: any) {
            console.error('Erro ao conectar:', error);
            setError(error.message);
            addNotification({
                type: 'error',
                message: `❌ Erro ao conectar: ${error.message}`,
            });
        }
    }, [setConnected, setError, addNotification, startReading]);

    const disconnectReal = useCallback(async () => {
        try {
            if (readerRef.current) {
                await readerRef.current.cancel();
                readerRef.current = null;
            }

            if (writerRef.current) {
                await writerRef.current.close();
                writerRef.current = null;
            }

            if (portRef.current) {
                await portRef.current.close();
                portRef.current = null;
            }

            setConnected(false);
            addNotification({
                type: 'info',
                message: '🔌 Desconectado',
            });
        } catch (error: any) {
            console.error('Erro ao desconectar:', error);
            addNotification({
                type: 'error',
                message: `❌ Erro ao desconectar: ${error.message}`,
            });
        }
    }, [setConnected, addNotification]);

    const uploadReal = useCallback(
        async (code: string) => {
            if (!portRef.current || !portRef.current.writable) {
                addNotification({
                    type: 'error',
                    message: '❌ Porta serial não está aberta',
                });
                return;
            }

            setUploading(true, 0);

            try {
                const writer = portRef.current.writable.getWriter();
                writerRef.current = writer;

                const encoder = new TextEncoder();

                // 1. Entrar no Raw REPL mode (Ctrl+A)
                await writer.write(encoder.encode('\x01'));
                await new Promise((resolve) => setTimeout(resolve, 100));
                setUploading(true, 10);

                // 2. Enviar código em chunks para evitar buffer overflow
                const lines = code.split('\n');
                const totalLines = lines.length;

                for (let i = 0; i < totalLines; i++) {
                    await writer.write(encoder.encode(lines[i] + '\n'));
                    await new Promise((resolve) => setTimeout(resolve, 10)); // Throttle

                    const progress = 10 + Math.floor((i / totalLines) * 80);
                    setUploading(true, progress);
                }

                // 3. Executar código (Ctrl+D)
                await writer.write(encoder.encode('\x04'));
                await new Promise((resolve) => setTimeout(resolve, 500));
                setUploading(true, 95);

                // 4. Soft Reset (Ctrl+D novamente)
                await writer.write(encoder.encode('\x04'));
                await new Promise((resolve) => setTimeout(resolve, 500));
                setUploading(true, 100);

                writer.releaseLock();
                writerRef.current = null;

                setUploading(false, 0);
                addNotification({
                    type: 'success',
                    message: '✅ Código enviado com sucesso!',
                });
            } catch (error: any) {
                console.error('Erro ao enviar código:', error);
                setError(error.message);
                setUploading(false, 0);
                addNotification({
                    type: 'error',
                    message: `❌ Erro ao enviar código: ${error.message}`,
                });
            }
        },
        [setUploading, setError, addNotification]
    );

    const sendCommandReal = useCallback(
        async (command: string) => {
            if (!portRef.current || !portRef.current.writable) {
                addNotification({
                    type: 'error',
                    message: '❌ Porta serial não está aberta',
                });
                return;
            }

            try {
                const writer = portRef.current.writable.getWriter();
                const encoder = new TextEncoder();
                await writer.write(encoder.encode(command + '\r\n'));
                writer.releaseLock();
            } catch (error: any) {
                console.error('Erro ao enviar comando:', error);
                addNotification({
                    type: 'error',
                    message: `❌ Erro ao enviar comando: ${error.message}`,
                });
            }
        },
        [addNotification]
    );

    // ========== Interface Pública ==========

    const connect = isMockMode ? connectMock : connectReal;
    const disconnect = isMockMode ? disconnectMock : disconnectReal;
    const upload = isMockMode ? uploadMock : uploadReal;
    const sendCommand = isMockMode ? sendCommandMock : sendCommandReal;

    // Cleanup ao desmontar
    useEffect(() => {
        return () => {
            if (mockIntervalRef.current) {
                clearInterval(mockIntervalRef.current);
            }
        };
    }, []);

    return {
        connect,
        disconnect,
        upload,
        sendCommand,
        isConnected: connection.isConnected,
        isUploading: connection.isUploading,
        uploadProgress: connection.uploadProgress,
        isMockMode,
    };
}
