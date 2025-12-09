import React from 'react';

// ============================================================================
// MAIN WORKSPACE - Área de trabalho principal (Blockly)
// ============================================================================

export const MainWorkspace: React.FC = () => {
    return (
        <div className="flex-1 bg-gray-950 grid-background relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center animate-pulse-slow">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-12 h-12 text-white"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                            />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-100">Workspace Blockly</h2>
                    <p className="text-gray-400 max-w-md">
                        O editor de blocos será integrado aqui. Arraste blocos da toolbox para programar seu
                        nanossatélite visualmente.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span>Sistema pronto para integração do Google Blockly</span>
                    </div>
                </div>
            </div>

            {/* Grid decorativo */}
            <div className="absolute inset-0 pointer-events-none opacity-30">
                <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-blue-500 to-transparent"></div>
            </div>
        </div>
    );
};
