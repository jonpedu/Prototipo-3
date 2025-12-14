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
    HardwareProfileType,
    HardwareCategory,
    NodeAction
} from '../core/types';
import { serialBridge } from '../core/serial';
import { transpiler } from '../core/transpiler';
import { addEdge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from '@xyflow/react';
import { getDriver } from '../core/drivers';
import { getActionDefinition } from '../config/actions';

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

    // ==================== ACTIONS PANEL ====================
    addActionToNode: (nodeId: string, actionType: string) => void;
    removeActionFromNode: (nodeId: string, actionId: string) => void;
    updateActionConfig: (nodeId: string, actionId: string, patch: Record<string, any>) => void;
    selectAction: (actionId: string | null) => void;

    // ==================== QUICK ACTIONS ====================
    testActuator: (nodeId: string) => void;

    // ==================== HEALTH ====================
    runSelfTest: () => void;
}

const MISSION_SCHEMA_VERSION = '2.1';
const DRIVER_SIGNATURE = 'drivers-2025-12-14';

export const useOrbitaStore = create<OrbitaStore>((set, get) => {

    // Configurar callbacks do serialBridge
    serialBridge.onStatusChange((status) => {
        set({ serialStatus: status });
    });

    serialBridge.onTelemetry((message) => {
        get().addTelemetryMessage(message);
    });

    // Helper interno: ajusta parâmetros derivados das ações (ex: LED branco vs RGB)
    const deriveParamsFromActions = (node: OrbitaNode): OrbitaNode => {
        const driver = getDriver(node.data.driverId);
        if (!driver || driver.id !== 'led_output') return node;

        const actions = node.data.actions || [];
        if (actions.length === 0) return node;

        const params = { ...node.data.parameters };
        const hasRgb = actions.some(a => a.type === 'led_fixed_rgb');
        const hasWhite = actions.some(a => ['led_blink', 'led_fixed_white', 'led_alert'].includes(a.type));

        if (hasRgb) {
            params.led_type = 'rgb';
        } else if (hasWhite) {
            params.led_type = 'white';
        }

        return {
            ...node,
            data: {
                ...node.data,
                parameters: params
            }
        };
    };

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
        selectedActionId: null,

        // ==================== CANVAS ACTIONS ====================

        setNodes: (nodes) => set({ nodes }),

        setEdges: (edges) => set({ edges }),

        onNodesChange: (changes) => {
            set({
                nodes: applyNodeChanges(changes, get().nodes) as OrbitaNode[]
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
            set({ selectedNode: node || null, selectedActionId: null });
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
                selectedNode: get().selectedNode?.id === nodeId ? null : get().selectedNode,
                selectedActionId: get().selectedNode?.id === nodeId ? null : get().selectedActionId
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
                selectedActionId: null,
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
            const { nodes, edges, hardwareProfile } = get();

            if (nodes.length === 0) {
                get().addTelemetryMessage({
                    timestamp: Date.now(),
                    type: 'error',
                    content: '✗ Canvas vazio. Adicione componentes antes de fazer upload.'
                });
                return;
            }

            // Transpila o código
            const result = transpiler.transpile(nodes, edges, hardwareProfile);

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
                version: MISSION_SCHEMA_VERSION,
                driverSignature: DRIVER_SIGNATURE,
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

                const remapActuatorEdges = (edges: OrbitaEdge[], nodes: OrbitaNode[]): OrbitaEdge[] => {
                    const actuatorIds = new Set(
                        nodes
                            .filter(n => ['led_output', 'buzzer'].includes(n.data.driverId))
                            .map(n => n.id)
                    );

                    return edges.map(edge => {
                        if (!actuatorIds.has(edge.target)) return edge;
                        if (!edge.targetHandle) return edge;
                        const legacyHandles = ['state', 'value', 'temperature', 'humidity'];
                        if (legacyHandles.includes(edge.targetHandle)) {
                            return { ...edge, targetHandle: 'input' } as OrbitaEdge;
                        }
                        return edge;
                    });
                };

                // Validação básica
                if (!missionData.nodes || !missionData.edges) {
                    throw new Error('Arquivo inválido: estrutura incorreta');
                }

                // Avisos de compatibilidade
                if (missionData.version && missionData.version !== MISSION_SCHEMA_VERSION) {
                    get().addTelemetryMessage({
                        timestamp: Date.now(),
                        type: 'log',
                        content: `⚠ Versão de missão diferente (arquivo ${missionData.version} vs app ${MISSION_SCHEMA_VERSION})`
                    });
                }

                if (missionData.driverSignature && missionData.driverSignature !== DRIVER_SIGNATURE) {
                    get().addTelemetryMessage({
                        timestamp: Date.now(),
                        type: 'log',
                        content: `⚠ Drivers diferem do arquivo salvo (arquivo ${missionData.driverSignature} vs app ${DRIVER_SIGNATURE})`
                    });
                }

                if (missionData.hardwareProfile && missionData.hardwareProfile !== get().hardwareProfile) {
                    get().addTelemetryMessage({
                        timestamp: Date.now(),
                        type: 'log',
                        content: `⚠ Perfil no arquivo (${missionData.hardwareProfile}) difere do atual (${get().hardwareProfile})`
                    });
                }

                // Limpa canvas atual
                get().clearCanvas();

                // Restaura estado
                const remappedEdges = remapActuatorEdges(missionData.edges, missionData.nodes);

                set({
                    nodes: missionData.nodes,
                    edges: remappedEdges,
                    hardwareProfile: missionData.hardwareProfile || HardwareProfileType.GENERIC_ESP32,
                    selectedNode: null,
                    selectedActionId: null
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
        },

        addActionToNode: (nodeId, actionType) => {
            const node = get().nodes.find(n => n.id === nodeId);
            if (!node) return;

            const definition = getActionDefinition(actionType);
            if (!definition) return;
            if (!definition.driverIds.includes(node.data.driverId)) return;

            const newAction: NodeAction = {
                id: `act_${Date.now()}`,
                type: definition.id,
                label: definition.label,
                config: definition.fields.reduce<Record<string, any>>((acc, field) => {
                    acc[field.id] = field.default;
                    return acc;
                }, {})
            };

            const currentActions = node.data.actions || [];
            const updatedNode = {
                ...node,
                data: {
                    ...node.data,
                    actions: [...currentActions, newAction]
                }
            };

            const withDerived = deriveParamsFromActions(updatedNode);

            set({
                nodes: get().nodes.map(n => (n.id === nodeId ? withDerived : n)),
                selectedNode: get().selectedNode?.id === nodeId ? withDerived : get().selectedNode,
                selectedActionId: newAction.id
            });
        },

        removeActionFromNode: (nodeId, actionId) => {
            const node = get().nodes.find(n => n.id === nodeId);
            if (!node) return;

            const updatedActions = (node.data.actions || []).filter(action => action.id !== actionId);
            const updatedNode = {
                ...node,
                data: {
                    ...node.data,
                    actions: updatedActions
                }
            };

            const withDerived = deriveParamsFromActions(updatedNode);

            const nextSelectedAction = get().selectedActionId === actionId ? null : get().selectedActionId;

            set({
                nodes: get().nodes.map(n => (n.id === nodeId ? withDerived : n)),
                selectedNode: get().selectedNode?.id === nodeId ? withDerived : get().selectedNode,
                selectedActionId: nextSelectedAction
            });
        },

        updateActionConfig: (nodeId, actionId, patch) => {
            const node = get().nodes.find(n => n.id === nodeId);
            if (!node) return;

            const updatedActions = (node.data.actions || []).map(action =>
                action.id === actionId
                    ? { ...action, config: { ...action.config, ...patch } }
                    : action
            );

            const updatedNode = {
                ...node,
                data: {
                    ...node.data,
                    actions: updatedActions
                }
            };

            const withDerived = deriveParamsFromActions(updatedNode);

            set({
                nodes: get().nodes.map(n => (n.id === nodeId ? withDerived : n)),
                selectedNode: get().selectedNode?.id === nodeId ? withDerived : get().selectedNode
            });
        },

        selectAction: (actionId) => {
            set({ selectedActionId: actionId });
        },

        testActuator: (nodeId) => {
            const node = get().nodes.find(n => n.id === nodeId);
            if (!node) return;

            const driver = getDriver(node.data.driverId);
            if (!driver || driver.category !== HardwareCategory.ACTUATOR) return;

            const message = `⚡ Teste rápido: ${node.data.label} (${driver.name}) com parâmetros atuais`;
            get().addTelemetryMessage({
                timestamp: Date.now(),
                type: 'log',
                content: message
            });

            if (!get().isMockMode) {
                get().addTelemetryMessage({
                    timestamp: Date.now(),
                    type: 'log',
                    content: 'Envie o código (Upload) para executar no dispositivo.'
                });
            } else {
                get().addTelemetryMessage({
                    timestamp: Date.now(),
                    type: 'data',
                    content: 'Simulação concluída em modo mock.'
                });
            }
        },

        runSelfTest: () => {
            const buildNode = (
                id: string,
                driverId: string,
                position: { x: number; y: number },
                overrides?: Record<string, any>,
                label?: string
            ): OrbitaNode | null => {
                const driver = getDriver(driverId);
                if (!driver) {
                    get().addTelemetryMessage({
                        timestamp: Date.now(),
                        type: 'error',
                        content: `Driver não encontrado para self-test: ${driverId}`
                    });
                    return null;
                }

                const parameters = driver.parameters.reduce<Record<string, any>>((acc, param) => {
                    const override = overrides?.[param.id];
                    acc[param.id] = override !== undefined ? override : param.default;
                    return acc;
                }, {});

                return {
                    id,
                    type: 'orbitaNode',
                    position,
                    data: {
                        driverId,
                        label: label || driver.name,
                        icon: driver.icon,
                        category: driver.category,
                        parameters
                    }
                } as OrbitaNode;
            };

            const bmeNode = buildNode('selftest-bme', 'bme280_sensor', { x: 80, y: 120 }, { interval: 1500 }, 'BME280');
            const ledNode = buildNode('selftest-led', 'led_output', { x: 360, y: 80 }, { blink_enabled: false }, 'LED Status');
            const sdNode = buildNode('selftest-sd', 'sd_logger', { x: 360, y: 200 }, { filename: 'selftest.csv', interval: 2000 }, 'Logger SD');

            if (!bmeNode || !ledNode || !sdNode) {
                return;
            }

            const edges: OrbitaEdge[] = [
                {
                    id: 'selftest-bme-led',
                    source: bmeNode.id,
                    sourceHandle: 'temperature',
                    target: ledNode.id,
                    targetHandle: 'temperature',
                    type: 'smoothstep',
                    animated: true
                },
                {
                    id: 'selftest-bme-sd',
                    source: bmeNode.id,
                    sourceHandle: 'temperature',
                    target: sdNode.id,
                    targetHandle: 'value',
                    type: 'smoothstep',
                    animated: true
                }
            ];

            set({ nodes: [bmeNode, ledNode, sdNode], edges });

            get().addTelemetryMessage({
                timestamp: Date.now(),
                type: 'log',
                content: '✓ Self-test carregado: BME280 -> LED + SD'
            });
        }
    };
});
