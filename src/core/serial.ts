/**
 * ORBITA - Serial Bridge
 * Gerenciador de comunicação serial com ESP32 via Web Serial API
 * Implementa protocolo Raw REPL do MicroPython com modo Mock para desenvolvimento
 */

import {
    ISerialBridge,
    SerialStatus,
    TelemetryMessage,
    SerialConfig
} from './types';

// Configuração padrão para MicroPython
const DEFAULT_SERIAL_CONFIG: SerialConfig = {
    baudRate: 115200,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
    flowControl: 'none'
};

/**
 * Implementação Mock para desenvolvimento sem hardware
 */
class MockSerialBridge implements ISerialBridge {
    private status: SerialStatus = SerialStatus.DISCONNECTED;
    private telemetryCallback?: (message: TelemetryMessage) => void;
    private statusCallback?: (status: SerialStatus) => void;
    private mockInterval?: number;

    async connect(): Promise<void> {
        this.updateStatus(SerialStatus.CONNECTING);

        // Simula delay de conexão
        await this.delay(800);

        this.updateStatus(SerialStatus.CONNECTED);

        // Envia mensagem de boas-vindas
        this.sendTelemetry({
            timestamp: Date.now(),
            type: 'log',
            content: 'MicroPython v1.20.0 (MOCK MODE) on ESP32'
        });

        this.sendTelemetry({
            timestamp: Date.now(),
            type: 'log',
            content: 'Type "help()" for more information.'
        });
    }

    async disconnect(): Promise<void> {
        if (this.mockInterval) {
            clearInterval(this.mockInterval);
            this.mockInterval = undefined;
        }

        this.updateStatus(SerialStatus.DISCONNECTED);

        this.sendTelemetry({
            timestamp: Date.now(),
            type: 'log',
            content: 'Dispositivo desconectado'
        });
    }

    async upload(code: string): Promise<void> {
        this.updateStatus(SerialStatus.UPLOADING);

        this.sendTelemetry({
            timestamp: Date.now(),
            type: 'log',
            content: '>>> Interrompendo execução... (Ctrl+C)'
        });

        await this.delay(300);

        this.sendTelemetry({
            timestamp: Date.now(),
            type: 'log',
            content: '>>> Entrando em Raw REPL mode... (Ctrl+A)'
        });

        await this.delay(200);

        const lines = code.split('\n');
        const totalBytes = code.length;

        this.sendTelemetry({
            timestamp: Date.now(),
            type: 'log',
            content: `>>> Enviando código (${lines.length} linhas, ${totalBytes} bytes)...`
        });

        // Simula envio em chunks
        const chunkSize = 256;
        let sentBytes = 0;

        while (sentBytes < totalBytes) {
            await this.delay(100);
            sentBytes += Math.min(chunkSize, totalBytes - sentBytes);
            const progress = Math.floor((sentBytes / totalBytes) * 100);

            if (progress % 25 === 0 || sentBytes >= totalBytes) {
                this.sendTelemetry({
                    timestamp: Date.now(),
                    type: 'log',
                    content: `>>> Upload: ${progress}%`
                });
            }
        }

        await this.delay(300);

        this.sendTelemetry({
            timestamp: Date.now(),
            type: 'log',
            content: '>>> Executando código... (Ctrl+D)'
        });

        await this.delay(500);

        this.updateStatus(SerialStatus.RUNNING);

        this.sendTelemetry({
            timestamp: Date.now(),
            type: 'log',
            content: '=== Código em execução ==='
        });

        // Inicia simulação de telemetria
        this.startMockTelemetry();
    }

    getStatus(): SerialStatus {
        return this.status;
    }

    onTelemetry(callback: (message: TelemetryMessage) => void): void {
        this.telemetryCallback = callback;
    }

    onStatusChange(callback: (status: SerialStatus) => void): void {
        this.statusCallback = callback;
    }

    // ==================== MÉTODOS PRIVADOS ====================

    private updateStatus(status: SerialStatus): void {
        this.status = status;
        this.statusCallback?.(status);
    }

    private sendTelemetry(message: TelemetryMessage): void {
        this.telemetryCallback?.(message);
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Simula telemetria de sensores
     */
    private startMockTelemetry(): void {
        if (this.mockInterval) {
            clearInterval(this.mockInterval);
        }

        let counter = 0;

        this.mockInterval = window.setInterval(() => {
            counter++;

            // Simula dados de sensores
            const temp = 20 + Math.random() * 10; // 20-30°C
            const humidity = 50 + Math.random() * 30; // 50-80%
            const value = Math.random() * 100;

            // Formato de telemetria parseável
            if (counter % 3 === 0) {
                this.sendTelemetry({
                    timestamp: Date.now(),
                    type: 'data',
                    content: `DATA: temp=${temp.toFixed(1)}`,
                    parsed: { temp }
                });
            }

            if (counter % 5 === 0) {
                this.sendTelemetry({
                    timestamp: Date.now(),
                    type: 'data',
                    content: `DATA: humidity=${humidity.toFixed(1)}`,
                    parsed: { humidity }
                });
            }

            if (counter % 2 === 0) {
                this.sendTelemetry({
                    timestamp: Date.now(),
                    type: 'data',
                    content: `DATA: value=${value.toFixed(2)}`,
                    parsed: { value }
                });
            }

            // Ocasionalmente envia logs
            if (counter % 10 === 0) {
                this.sendTelemetry({
                    timestamp: Date.now(),
                    type: 'log',
                    content: `[${counter}] Sistema operacional`
                });
            }

        }, 1000);
    }
}

/**
 * Implementação Real usando Web Serial API
 */
class RealSerialBridge implements ISerialBridge {
    private port: SerialPort | null = null;
    private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
    private status: SerialStatus = SerialStatus.DISCONNECTED;
    private telemetryCallback?: (message: TelemetryMessage) => void;
    private statusCallback?: (status: SerialStatus) => void;

    async connect(): Promise<void> {
        if (!('serial' in navigator)) {
            throw new Error('Web Serial API não suportada neste navegador. Use Chrome/Edge 89+');
        }

        try {
            this.updateStatus(SerialStatus.CONNECTING);

            // Solicita porta ao usuário
            this.port = await navigator.serial.requestPort();
            await this.port.open(DEFAULT_SERIAL_CONFIG);

            this.reader = this.port.readable.getReader();
            this.writer = this.port.writable.getWriter();

            this.updateStatus(SerialStatus.CONNECTED);

            // Inicia leitura contínua
            this.startReading();

            this.sendTelemetry({
                timestamp: Date.now(),
                type: 'log',
                content: 'Conectado ao dispositivo'
            });

        } catch (error) {
            this.updateStatus(SerialStatus.ERROR);
            throw new Error(`Falha na conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
    }

    async disconnect(): Promise<void> {
        try {
            if (this.reader) {
                await this.reader.cancel();
                this.reader.releaseLock();
                this.reader = null;
            }

            if (this.writer) {
                this.writer.releaseLock();
                this.writer = null;
            }

            if (this.port) {
                await this.port.close();
                this.port = null;
            }

            this.updateStatus(SerialStatus.DISCONNECTED);

        } catch (error) {
            console.error('Erro ao desconectar:', error);
        }
    }

    async upload(code: string): Promise<void> {
        if (!this.writer) {
            throw new Error('Porta serial não conectada');
        }

        this.updateStatus(SerialStatus.UPLOADING);

        try {
            // 1. Interrompe execução (Ctrl+C)
            await this.sendBytes(new Uint8Array([0x03]));
            await this.delay(100);

            // 2. Entra em Raw REPL mode (Ctrl+A)
            await this.sendBytes(new Uint8Array([0x01]));
            await this.delay(300);

            // 3. Envia código em chunks para evitar buffer overflow
            const encoder = new TextEncoder();
            const codeBytes = encoder.encode(code);
            const chunkSize = 256;

            for (let i = 0; i < codeBytes.length; i += chunkSize) {
                const chunk = codeBytes.slice(i, i + chunkSize);
                await this.sendBytes(chunk);
                await this.delay(50); // Pequeno delay entre chunks
            }

            // 4. Finaliza e executa (Ctrl+D)
            await this.sendBytes(new Uint8Array([0x04]));

            this.updateStatus(SerialStatus.RUNNING);

            this.sendTelemetry({
                timestamp: Date.now(),
                type: 'log',
                content: 'Código enviado e executando'
            });

        } catch (error) {
            this.updateStatus(SerialStatus.ERROR);
            throw new Error(`Falha no upload: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
    }

    getStatus(): SerialStatus {
        return this.status;
    }

    onTelemetry(callback: (message: TelemetryMessage) => void): void {
        this.telemetryCallback = callback;
    }

    onStatusChange(callback: (status: SerialStatus) => void): void {
        this.statusCallback = callback;
    }

    // ==================== MÉTODOS PRIVADOS ====================

    private async sendBytes(data: Uint8Array): Promise<void> {
        if (this.writer) {
            await this.writer.write(data);
        }
    }

    private async startReading(): Promise<void> {
        if (!this.reader) return;

        const decoder = new TextDecoder();
        let buffer = '';

        try {
            while (true) {
                const { value, done } = await this.reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Processa linhas completas
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Mantém última linha incompleta

                lines.forEach(line => {
                    if (line.trim()) {
                        this.parseTelemetry(line.trim());
                    }
                });
            }
        } catch (error) {
            console.error('Erro na leitura serial:', error);
        }
    }

    private parseTelemetry(line: string): void {
        // Detecta formato "DATA: key=value"
        const dataMatch = line.match(/^DATA:\s*(\w+)=(.+)$/i);

        if (dataMatch) {
            const [, key, value] = dataMatch;
            const numValue = parseFloat(value);

            this.sendTelemetry({
                timestamp: Date.now(),
                type: 'data',
                content: line,
                parsed: { [key]: isNaN(numValue) ? value : numValue }
            });
        } else if (line.toLowerCase().includes('error') || line.toLowerCase().includes('traceback')) {
            this.sendTelemetry({
                timestamp: Date.now(),
                type: 'error',
                content: line
            });
        } else {
            this.sendTelemetry({
                timestamp: Date.now(),
                type: 'log',
                content: line
            });
        }
    }

    private updateStatus(status: SerialStatus): void {
        this.status = status;
        this.statusCallback?.(status);
    }

    private sendTelemetry(message: TelemetryMessage): void {
        this.telemetryCallback?.(message);
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Factory: retorna implementação Mock ou Real baseado na variável de ambiente
 */
export function createSerialBridge(): ISerialBridge {
    const useMock = import.meta.env.VITE_USE_MOCK === 'true';

    if (useMock) {
        console.log('🔧 ORBITA: Usando SerialBridge em MODO MOCK (desenvolvimento)');
        return new MockSerialBridge();
    } else {
        console.log('🚀 ORBITA: Usando SerialBridge REAL (Web Serial API)');
        return new RealSerialBridge();
    }
}

// Instância singleton
export const serialBridge = createSerialBridge();
