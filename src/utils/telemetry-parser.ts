import type { TelemetryData } from '../types';

// ============================================================================
// TELEMETRY PARSER - Parseia dados seriais do ESP32
// ============================================================================

/**
 * Parseia uma linha de telemetria no formato: DATA:key1=value1;key2=value2
 */
export function parseTelemetryLine(line: string): TelemetryData {
    const timestamp = Date.now();
    const raw = line.trim();

    // Formato esperado: DATA:temperatura=25.5;umidade=60.2;altitude=150.5
    const dataMatch = raw.match(/DATA:(.+)/);

    if (!dataMatch) {
        return { timestamp, raw };
    }

    const dataString = dataMatch[1];
    const parsed: Record<string, number | string> = {};

    // Split por ';' para obter pares key=value
    const pairs = dataString.split(';');

    pairs.forEach((pair) => {
        const [key, valueStr] = pair.split('=');
        if (key && valueStr) {
            const trimmedKey = key.trim();
            const trimmedValue = valueStr.trim();

            // Tentar converter para número
            const numValue = parseFloat(trimmedValue);
            parsed[trimmedKey] = isNaN(numValue) ? trimmedValue : numValue;
        }
    });

    return {
        timestamp,
        raw,
        parsed: Object.keys(parsed).length > 0 ? parsed : undefined,
    };
}

/**
 * Extrai valores numéricos de dados parseados para plotagem
 */
export function extractPlotData(
    telemetryData: TelemetryData[],
    keys?: string[]
): Record<string, Array<{ timestamp: number; value: number }>> {
    const plotData: Record<string, Array<{ timestamp: number; value: number }>> = {};

    telemetryData.forEach((entry) => {
        if (!entry.parsed) return;

        Object.entries(entry.parsed).forEach(([key, value]) => {
            // Filtrar por keys se fornecido
            if (keys && !keys.includes(key)) return;

            // Apenas valores numéricos
            if (typeof value !== 'number') return;

            if (!plotData[key]) {
                plotData[key] = [];
            }

            plotData[key].push({
                timestamp: entry.timestamp,
                value,
            });
        });
    });

    return plotData;
}

/**
 * Gera cores para gráficos baseado no índice
 */
export function getPlotColor(index: number): string {
    const colors = [
        '#3b82f6', // blue
        '#10b981', // green
        '#f59e0b', // amber
        '#ef4444', // red
        '#8b5cf6', // violet
        '#ec4899', // pink
        '#06b6d4', // cyan
        '#f97316', // orange
    ];
    return colors[index % colors.length];
}

/**
 * Formata timestamp para exibição
 */
export function formatTimestamp(timestamp: number, mode: 'time' | 'relative' = 'time'): string {
    if (mode === 'time') {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 1,
        });
    } else {
        // Modo relativo (ex: "+2.5s")
        const now = Date.now();
        const diff = (timestamp - now) / 1000;
        return `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}s`;
    }
}

/**
 * Exporta dados de telemetria como CSV
 */
export function exportTelemetryAsCSV(telemetryData: TelemetryData[]): string {
    if (telemetryData.length === 0) return '';

    // Obter todas as chaves únicas
    const allKeys = new Set<string>();
    telemetryData.forEach((entry) => {
        if (entry.parsed) {
            Object.keys(entry.parsed).forEach((key) => allKeys.add(key));
        }
    });

    const keys = Array.from(allKeys);
    const headers = ['timestamp', 'raw', ...keys];

    // Criar linhas CSV
    const csvLines = [headers.join(',')];

    telemetryData.forEach((entry) => {
        const row = [
            new Date(entry.timestamp).toISOString(),
            `"${entry.raw.replace(/"/g, '""')}"`,
            ...keys.map((key) => (entry.parsed?.[key] ?? '')),
        ];
        csvLines.push(row.join(','));
    });

    return csvLines.join('\n');
}

/**
 * Gera telemetria simulada (para Mock Mode)
 */
export function generateMockTelemetry(): string {
    const temperature = (20 + Math.random() * 10).toFixed(1);
    const humidity = (50 + Math.random() * 30).toFixed(1);
    const pressure = (1000 + Math.random() * 50).toFixed(1);
    const altitude = (Math.random() * 200).toFixed(1);
    const accel_x = (Math.random() * 2 - 1).toFixed(2);
    const accel_y = (Math.random() * 2 - 1).toFixed(2);
    const accel_z = (9.8 + Math.random() * 0.5).toFixed(2);

    return `DATA:temperatura=${temperature};umidade=${humidity};pressao=${pressure};altitude=${altitude};accel_x=${accel_x};accel_y=${accel_y};accel_z=${accel_z}`;
}
