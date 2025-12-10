/**
 * ORBITA - Console
 * Console de telemetria na parte inferior da tela
 */

import React, { useRef, useEffect } from 'react';
import { useOrbitaStore } from '../../store/useStore';

export const Console: React.FC = () => {
    const { telemetryMessages, isConsoleOpen } = useOrbitaStore();
    const consoleEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll para a última mensagem
    useEffect(() => {
        consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [telemetryMessages]);

    if (!isConsoleOpen) return null;

    return (
        <div className="h-48 bg-gray-950 border-t border-gray-800 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-4 py-2 bg-gray-900 border-b border-gray-800 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-200">Console</h3>
                <span className="text-xs text-gray-500">
                    {telemetryMessages.length} mensagens
                </span>
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
