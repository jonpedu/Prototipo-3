import React from 'react';
import { Blocks, Code, Activity, Box, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { TelemetryConsole } from '../telemetry/TelemetryConsole';
import { TelemetryPlotter } from '../telemetry/TelemetryPlotter';
import { DebugPanel } from '../telemetry/DebugPanel';
import { useWebSerialStore } from '../../stores/webSerialStore';
import { useBlocklyStore } from '../../stores/blocklyStore';
import type { PanelTab } from '../../types';

// ============================================================================
// SIDEBAR - Barra lateral com abas
// ============================================================================

export const Sidebar: React.FC = () => {
    const { activePanel, isSidebarCollapsed, setActivePanel, toggleSidebar } = useUIStore();

    const tabs: Array<{ id: PanelTab; label: string; icon: React.ReactNode }> = [
        { id: 'modules', label: 'Módulos', icon: <Box size={20} /> },
        { id: 'inspector', label: 'Inspetor', icon: <Code size={20} /> },
        { id: 'telemetry', label: 'Telemetria', icon: <Activity size={20} /> },
        { id: 'console', label: 'Console', icon: <Blocks size={20} /> },
    ];

    return (
        <div
            className={`bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-80'
                }`}
        >
            {/* Tabs Header */}
            <div className="flex items-center border-b border-gray-800 h-12 px-2 gap-1">
                {!isSidebarCollapsed &&
                    tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActivePanel(tab.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${activePanel === tab.id
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                                }`}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}

                {/* Collapse Button */}
                <button
                    onClick={toggleSidebar}
                    className="ml-auto p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
                    aria-label={isSidebarCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
                >
                    {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            {/* Panel Content */}
            {!isSidebarCollapsed && (
                <div className="flex-1 overflow-y-auto p-4 flex flex-col">
                    {activePanel === 'modules' && <ModulesPanel />}
                    {activePanel === 'inspector' && <InspectorPanel />}
                    {activePanel === 'telemetry' && <TelemetryPanel />}
                    {activePanel === 'console' && <ConsolePanel />}
                </div>
            )}
        </div>
    );
};

// Painéis temporários (serão implementados em arquivos separados)
const ModulesPanel: React.FC = () => {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-100">Módulos de Hardware</h3>
            <p className="text-sm text-gray-400">
                Adicione módulos de hardware ao seu satélite clicando no botão abaixo.
            </p>
            <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                + Adicionar Módulo
            </button>
        </div>
    );
};

const InspectorPanel: React.FC = () => {
    const { generatedCode } = useBlocklyStore();

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-semibold text-gray-100">Inspetor de Código</h3>
                <p className="text-sm text-gray-400">Código MicroPython gerado</p>
            </div>

            <div className="bg-gray-950 border border-gray-800 rounded-lg p-4 overflow-x-auto">
                {generatedCode ? (
                    <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                        {generatedCode}
                    </pre>
                ) : (
                    <div className="text-center text-gray-500 py-8">
                        <p>Nenhum código gerado ainda</p>
                        <p className="text-xs mt-2">Adicione blocos no workspace</p>
                    </div>
                )}
            </div>
        </div>
    );
};
const TelemetryPanel: React.FC = () => {
    const { telemetryData } = useWebSerialStore();

    return (
        <div className="space-y-4 h-full flex flex-col overflow-y-auto">
            {telemetryData.length > 0 ? (
                <TelemetryPlotter />
            ) : (
                <DebugPanel />
            )}
        </div>
    );
};  );
};

const ConsolePanel: React.FC = () => {
    const { telemetryData } = useWebSerialStore();

    return (
        <div className="h-full flex flex-col">
            <TelemetryConsole />
        </div>
    );
};
