/**
 * ORBITA - Zustand Store
 * Gerenciamento de estado global da aplicação
 */

import { create } from 'zustand';
import {
    OrbitaNode,
    OrbitaEdge,
    SerialStatus,
    TelemetryMessage,
    AppState,
    HardwareProfileType
} from '../core/types';
import { serialBridge } from '../core/serial';
import { transpiler } from '../core/transpiler';
import { addEdge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from '@xyflow/react';

interface OrbitaStore extends AppState {
    // ==================== CANVAS ACTIONS ====================

    setNodes: (nodes: OrbitaNode[]) => void;
    setEdges: (edges: OrbitaEdge[]) => void;
    onNodesChange: (changes: NodeChange[]) => void;
    onEdgesChange: (changes: EdgeChange[]) => void;
    onConnect: (connection: any) => void;

    addNode: (node: OrbitaNode) => void;
    selectNode: (nodeId: string | null) => void;
    updateNodeData: (nodeId: string, data: Partial<OrbitaNode['data']>) => void;
    deleteNode: (nodeId: string) => void;
    deleteEdge: (edgeId: string) => void;
    clearCanvas: () => void;

    // ==================== HARDWARE ACTIONS ====================

    connectSerial: () => Promise<void>;
    disconnectSerial: () => Promise<void>;
    uploadCode: () => Promise<void>;
    addTelemetryMessage: (message: TelemetryMessage) => void;
    clearTelemetry: () => void;
    setHardwareProfile: (profile: HardwareProfileType) => void;

    // ==================== PERSISTENCE ACTIONS ====================

    saveMission: () => void;
    loadMission: (data: string) => void;

    // ==================== UI ACTIONS ====================

    toggleInspector: () => void;
    toggleConsole: () => void;
    setMockMode: (enabled: boolean) => void;
}

export const useOrbitaStore = create<OrbitaStore>((set, get) => {

    // Configurar callbacks do serialBridge
    serialBridge.onStatusChange((status) => {
        set({ serialStatus: status });
    });

    serialBridge.onTelemetry((message) => {
        get().addTelemetryMessage(message);
    });

    return {
        // ==================== ESTADO INICIAL ====================
        nodes: [],
        edges: [],
        selectedNode: null,
        serialStatus: SerialStatus.DISCONNECTED,
        telemetryMessages: [],
        lastCode: null,
        hardwareProfile: HardwareProfileType.GENERIC_ESP32,
        isInspectorOpen: true,
        isConsoleOpen: true,
        isMockMode: import.meta.env.VITE_USE_MOCK === 'true',

        // ==================== CANVAS ACTIONS ====================

        setNodes: (nodes) => set({ nodes }),

        setEdges: (edges) => set({ edges }),

        onNodesChange: (changes) => {
            set({
                nodes: applyNodeChanges(changes, get().nodes)
            });
        },

        onEdgesChange: (changes) => {
            set({
                edges: applyEdgeChanges(changes, get().edges)
            });
        },

        onConnect: (connection) => {
            set({
                edges: addEdge(connection, get().edges)
            });
        },

        addNode: (node) => {
            set({
                nodes: [...get().nodes, node]
            });
        },

        selectNode: (nodeId) => {
            const node = nodeId ? get().nodes.find(n => n.id === nodeId) : null;
            set({ selectedNode: node || null });
        },

        updateNodeData: (nodeId, data) => {
            set({
                nodes: get().nodes.map(node =>
                    node.id === nodeId
                        ? { ...node, data: { ...node.data, ...data } }
                        : node
                )
            });

            // Atualiza selectedNode se for o nó selecionado
            const selected = get().selectedNode;
            if (selected && selected.id === nodeId) {
                set({
                    selectedNode: {
                        ...selected,
                        data: { ...selected.data, ...data }
                    }
                });
            }
        },

        deleteNode: (nodeId) => {
            set({
                nodes: get().nodes.filter(n => n.id !== nodeId),
                edges: get().edges.filter(e => e.source !== nodeId && e.target !== nodeId),
                selectedNode: get().selectedNode?.id === nodeId ? null : get().selectedNode
            });
        },

        deleteEdge: (edgeId) => {
            set({
                edges: get().edges.filter(e => e.id !== edgeId)
            });
        },

        clearCanvas: () => {
            set({
                nodes: [],
                edges: [],
                selectedNode: null,
                lastCode: null
            });
        },

        // ==================== HARDWARE ACTIONS ====================

        connectSerial: async () => {
            try {
                await serialBridge.connect();
                get().addTelemetryMessage({
                    timestamp: Date.now(),
                    type: 'log',
                    content: '✓ Conexão estabelecida com sucesso'
                });
            } catch (error) {
                get().addTelemetryMessage({
                    timestamp: Date.now(),
                    type: 'error',
                    content: `✗ Erro na conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
                });
            }
        },

        disconnectSerial: async () => {
            try {
                await serialBridge.disconnect();
            } catch (error) {
                console.error('Erro ao desconectar:', error);
            }
        },

        uploadCode: async () => {
            const { nodes, edges } = get();

            if (nodes.length === 0) {
                get().addTelemetryMessage({
                    timestamp: Date.now(),
                    type: 'error',
                    content: '✗ Canvas vazio. Adicione componentes antes de fazer upload.'
                });
                return;
            }

            // Transpila o código
            const result = transpiler.transpile(nodes, edges);

            if (!result.success || !result.code) {
                get().addTelemetryMessage({
                    timestamp: Date.now(),
                    type: 'error',
                    content: `✗ Erro na transpilação: ${result.errors?.join(', ')}`
                });
                return;
            }

            set({ lastCode: result.code });

            get().addTelemetryMessage({
                timestamp: Date.now(),
                type: 'log',
                content: `✓ Código transpilado (${result.nodeCount} nós)`
            });

            // Faz upload
            try {
                await serialBridge.upload(result.code);
            } catch (error) {
                get().addTelemetryMessage({
                    timestamp: Date.now(),
                    type: 'error',
                    content: `✗ Erro no upload: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
                });
            }
        },

        addTelemetryMessage: (message) => {
            set({
                telemetryMessages: [...get().telemetryMessages, message].slice(-1000) // Mantém últimas 1000 mensagens
            });
        },

        clearTelemetry: () => {
            set({ telemetryMessages: [] });
        },

        setHardwareProfile: (profile) => {
            set({ hardwareProfile: profile });
        },

        // ==================== PERSISTENCE ACTIONS ====================

        saveMission: () => {
            const { nodes, edges, hardwareProfile } = get();
            
            const missionData = {
                version: '2.0',
                timestamp: new Date().toISOString(),
                hardwareProfile,
                nodes,
                edges
            };

            const dataStr = JSON.stringify(missionData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `missao-${Date.now()}.orbita`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            get().addTelemetryMessage({
                timestamp: Date.now(),
                type: 'log',
                content: '✓ Missão salva com sucesso'
            });
        },

        loadMission: (data) => {
            try {
                const missionData = JSON.parse(data);
                
                // Validação básica
                if (!missionData.nodes || !missionData.edges) {
                    throw new Error('Arquivo inválido: estrutura incorreta');
                }

                // Limpa canvas atual
                get().clearCanvas();

                // Restaura estado
                set({
                    nodes: missionData.nodes,
                    edges: missionData.edges,
                    hardwareProfile: missionData.hardwareProfile || HardwareProfileType.GENERIC_ESP32
                });

                get().addTelemetryMessage({
                    timestamp: Date.now(),
                    type: 'log',
                    content: `✓ Missão carregada (${missionData.nodes.length} componentes)`
                });
            } catch (error) {
                get().addTelemetryMessage({
                    timestamp: Date.now(),
                    type: 'error',
                    content: `✗ Erro ao carregar missão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
                });
            }
        },

        // ==================== UI ACTIONS ====================

        toggleInspector: () => {
            set({ isInspectorOpen: !get().isInspectorOpen });
        },

        toggleConsole: () => {
            set({ isConsoleOpen: !get().isConsoleOpen });
        },

        setMockMode: (enabled) => {
            set({ isMockMode: enabled });
        }
    };
});
