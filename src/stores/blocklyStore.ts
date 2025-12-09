import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// BLOCKLY STORE - Gerencia workspace Blockly e código gerado
// ============================================================================

interface BlocklyState {
    // Workspace XML (serialização)
    workspaceXml: string;

    // Código gerado
    generatedCode: string;
    codeGenerationTimestamp: number;

    // Metadados
    usedBlocks: string[];
    usedModuleTypes: string[];

    // Actions
    setWorkspaceXml: (xml: string) => void;
    setGeneratedCode: (code: string, usedBlocks: string[], usedModuleTypes: string[]) => void;
    clearWorkspace: () => void;
    loadWorkspace: (xml: string) => void;
}

export const useBlocklyStore = create<BlocklyState>()(
    persist(
        (set) => ({
            // Estado inicial
            workspaceXml: '',
            generatedCode: '',
            codeGenerationTimestamp: 0,
            usedBlocks: [],
            usedModuleTypes: [],

            // Actions
            setWorkspaceXml: (xml) => {
                set({ workspaceXml: xml });
            },

            setGeneratedCode: (code, usedBlocks, usedModuleTypes) => {
                set({
                    generatedCode: code,
                    codeGenerationTimestamp: Date.now(),
                    usedBlocks,
                    usedModuleTypes,
                });
            },

            clearWorkspace: () => {
                set({
                    workspaceXml: '',
                    generatedCode: '',
                    usedBlocks: [],
                    usedModuleTypes: [],
                });
            },

            loadWorkspace: (xml) => {
                set({
                    workspaceXml: xml,
                });
            },
        }),
        {
            name: 'orbita-blockly-storage',
        }
    )
);
