/**
 * ORBITA - Console
 * Console de telemetria na parte inferior da tela
 */

import React, { useRef, useEffect, useState } from 'react';
import { useOrbitaStore } from '../../store/useStore';
import { Minus } from 'lucide-react';

export const Console: React.FC<{ onMinimize?: () => void; hideHeaderMinimize?: boolean }> = ({ onMinimize, hideHeaderMinimize }) => {
    const { telemetryMessages, isConsoleOpen, clearTelemetry } = useOrbitaStore();
    const consoleEndRef = useRef<HTMLDivElement>(null);
    const [autoScroll, setAutoScroll] = useState(() => localStorage.getItem('console.autoScroll') !== 'false');

    // Auto-scroll para a última mensagem
    useEffect(() => {
        if (autoScroll) {
            consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [telemetryMessages, autoScroll]);

    useEffect(() => {
        localStorage.setItem('console.autoScroll', String(autoScroll));
    }, [autoScroll]);

    if (!isConsoleOpen) return null;

    return (
        <div className="h-full bg-gray-950 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-4 py-2 bg-gray-900 border-b border-gray-800 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-200">Console</h3>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{telemetryMessages.length} mensagens</span>
                    <label className="flex items-center gap-1 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={autoScroll}
                            onChange={(e) => setAutoScroll(e.target.checked)}
                            className="w-4 h-4 rounded bg-gray-800 border-gray-700 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                        Auto-scroll
                    </label>
                    <button
                        onClick={clearTelemetry}
                        className="px-2 py-1 rounded border border-gray-700 bg-gray-800/60 hover:border-gray-600 text-gray-300"
                    >
                        Limpar
                    </button>
                    {onMinimize && !hideHeaderMinimize && (
                        <button
                            onClick={onMinimize}
                            className="px-2 py-1 rounded border border-gray-700 bg-gray-800/60 hover:border-gray-600 text-gray-300 flex items-center gap-1"
                            title="Minimizar"
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-grow overflow-y-auto px-4 py-2 font-mono text-xs">
                {telemetryMessages.length === 0 ? (
                    <div className="text-gray-600 text-center py-4">
                        Aguardando telemetria...
                    </div>
                ) : (
                    <div className="space-y-1">
                        {telemetryMessages.map((msg, idx) => {
                            const timestamp = new Date(msg.timestamp).toLocaleTimeString('pt-BR');

                            const colorClasses = {
                                data: 'text-green-400',
                                log: 'text-gray-400',
                                error: 'text-red-400'
                            };

                            return (
                                <div key={idx} className="flex gap-2">
                                    <span className="text-gray-600">[{timestamp}]</span>
                                    <span className={colorClasses[msg.type]}>
                                        {msg.content}
                                    </span>
                                </div>
                            );
                        })}
                        <div ref={consoleEndRef} />
                    </div>
                )}
            </div>
        </div>
    );
};
