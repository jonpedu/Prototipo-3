import React, { useEffect, useRef } from 'react';
import { Trash2, Download } from 'lucide-react';
import { useWebSerialStore } from '../../stores/webSerialStore';
import { Button } from '../ui/Button';
import { exportTelemetryAsCSV } from '../../utils/telemetry-parser';

// ============================================================================
// TELEMETRY CONSOLE - Console de telemetria em tempo real
// ============================================================================

export const TelemetryConsole: React.FC = () => {
    const { telemetryData, clearTelemetry } = useWebSerialStore();
    const consoleRef = useRef<HTMLDivElement>(null);

    // Auto-scroll para o final quando novos dados chegam
    useEffect(() => {
        if (consoleRef.current) {
            consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
        }
    }, [telemetryData]);

    const handleExport = () => {
        const csv = exportTelemetryAsCSV(telemetryData);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `telemetry_${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h3 className="text-lg font-semibold text-gray-100">Console de Telemetria</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {telemetryData.length} entrada{telemetryData.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleExport}
                        disabled={telemetryData.length === 0}
                        icon={<Download size={16} />}
                    >
                        CSV
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={clearTelemetry}
                        disabled={telemetryData.length === 0}
                        icon={<Trash2 size={16} />}
                    >
                        Limpar
                    </Button>
                </div>
            </div>

            {/* Console */}
            <div
                ref={consoleRef}
                className="flex-1 bg-gray-950 border border-gray-800 rounded-lg p-3 overflow-y-auto font-mono text-xs"
            >
                {telemetryData.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                            <p>Aguardando dados de telemetria...</p>
                            <p className="text-xs mt-2">Conecte ao dispositivo para começar</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {telemetryData.map((entry, index) => (
                            <div key={index} className="flex items-start gap-3 hover:bg-gray-900/50 px-2 py-1 rounded">
                                {/* Timestamp */}
                                <span className="text-gray-500 flex-shrink-0 w-20">
                                    {new Date(entry.timestamp).toLocaleTimeString('pt-BR', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                    })}
                                </span>

                                {/* Data */}
                                <div className="flex-1">
                                    {entry.parsed ? (
                                        <div className="flex flex-wrap gap-3">
                                            {Object.entries(entry.parsed).map(([key, value]) => (
                                                <span key={key} className="text-gray-300">
                                                    <span className="text-cyan-400">{key}</span>
                                                    <span className="text-gray-500">=</span>
                                                    <span className="text-green-400">{value}</span>
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">{entry.raw}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
