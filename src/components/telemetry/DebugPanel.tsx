import React, { useEffect } from 'react';
import { useWebSerialStore } from '../../stores/webSerialStore';
import { useWebSerial } from '../../hooks/useWebSerial';

// ============================================================================
// DEBUG PANEL - Painel de debug para verificar telemetria
// ============================================================================

export const DebugPanel: React.FC = () => {
    const { telemetryData, connection, mockConfig } = useWebSerialStore();
    const { isConnected, isMockMode } = useWebSerial();

    useEffect(() => {
        console.log('[DEBUG] Telemetry Data Count:', telemetryData.length);
        console.log('[DEBUG] Is Connected:', isConnected);
        console.log('[DEBUG] Mock Mode:', isMockMode);
        console.log('[DEBUG] Mock Config:', mockConfig);
        if (telemetryData.length > 0) {
            console.log('[DEBUG] Latest Entry:', telemetryData[telemetryData.length - 1]);
        }
    }, [telemetryData, isConnected, isMockMode, mockConfig]);

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-semibold text-gray-100 mb-2">Painel de Debug</h3>
            </div>

            <div className="space-y-2 text-sm">
                <div className="bg-gray-900 border border-gray-800 rounded p-3">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Modo:</span>
                        <span className="text-cyan-400 font-mono">
                            {isMockMode ? '🧪 Simulação' : '🔌 Real'}
                        </span>
                    </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded p-3">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Status de Conexão:</span>
                        <span className={`font-mono ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                            {isConnected ? '✅ Conectado' : '❌ Desconectado'}
                        </span>
                    </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded p-3">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Total de Entradas:</span>
                        <span className="text-blue-400 font-mono">{telemetryData.length}</span>
                    </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded p-3">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Intervalo de Telemetria:</span>
                        <span className="text-purple-400 font-mono">{mockConfig.telemetryInterval}ms</span>
                    </div>
                </div>

                {telemetryData.length > 0 && (
                    <div className="bg-gray-900 border border-gray-800 rounded p-3">
                        <div className="text-gray-400 mb-2">Última Entrada:</div>
                        <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap overflow-x-auto">
                            {JSON.stringify(telemetryData[telemetryData.length - 1], null, 2)}
                        </pre>
                    </div>
                )}
            </div>

            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-3">
                <p className="text-yellow-400 text-xs">
                    💡 <strong>Dica:</strong> Conecte ao dispositivo (botão no header) para começar a receber
                    telemetria simulada.
                </p>
            </div>
        </div>
    );
};
