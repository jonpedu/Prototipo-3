/**
 * ORBITA - Canvas
 * Área principal de trabalho com React Flow
 */

import React, { useCallback, useRef, useEffect } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    BackgroundVariant,
    ReactFlowProvider,
    MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useOrbitaStore } from '../../store/useStore';
import { getDriver } from '../../core/drivers';
import { getHardwareProfile } from '../../config/hardware-profiles';
import OrbitaNode from '../nodes/OrbitaNode';

const nodeTypes = {
    orbitaNode: OrbitaNode
};

const CanvasContent: React.FC = () => {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);

    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        addNode,
        selectNode,
        deleteNode,
        deleteEdge,
        hardwareProfile,
        selectedNode,
        addActionToNode,
        addTelemetryMessage
    } = useOrbitaStore();

    // Handler para deletar nós e edges com tecla Delete/Backspace
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Delete' || event.key === 'Backspace') {
                // Previne comportamento padrão (voltar página) se não estiver em input
                if ((event.target as HTMLElement).tagName !== 'INPUT' &&
                    (event.target as HTMLElement).tagName !== 'TEXTAREA') {
                    event.preventDefault();

                    // Deleta nós selecionados
                    nodes.filter(node => node.selected).forEach(node => {
                        deleteNode(node.id);
                    });

                    // Deleta edges selecionadas
                    edges.filter(edge => edge.selected).forEach(edge => {
                        deleteEdge(edge.id);
                    });
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nodes, edges, deleteNode, deleteEdge]);

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const actionType = event.dataTransfer.getData('application/orbita-action');
            if (actionType) {
                if (selectedNode) {
                    addActionToNode(selectedNode.id, actionType);
                } else {
                    addTelemetryMessage({
                        timestamp: Date.now(),
                        type: 'log',
                        content: 'Arraste um componente antes de anexar acoes.'
                    });
                }
                return;
            }

            const driverId = event.dataTransfer.getData('application/reactflow');
            if (!driverId) return;

            const driver = getDriver(driverId);
            if (!driver) return;

            // Bloqueia drop de drivers não permitidos no perfil atual
            const profile = getHardwareProfile(hardwareProfile);
            if (profile.allowedDrivers && !profile.allowedDrivers.includes(driver.id)) return;

            const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
            if (!reactFlowBounds) return;

            const position = {
                x: event.clientX - reactFlowBounds.left - 90,
                y: event.clientY - reactFlowBounds.top - 40
            };

            const newNode: any = {
                id: `node_${Date.now()}`,
                type: 'orbitaNode',
                position,
                data: {
                    driverId: driver.id,
                    label: driver.name,
                    icon: driver.icon,
                    category: driver.category,
                    parameters: driver.parameters.reduce((acc, param) => ({
                        ...acc,
                        [param.id]: param.default
                    }), {})
                }
            };

            addNode(newNode);
        },
        [addNode, addActionToNode, addTelemetryMessage, hardwareProfile, selectedNode]
    );

    const onNodeClick = useCallback(
        (_event: React.MouseEvent, node: any) => {
            selectNode(node.id);
        },
        [selectNode]
    );

    const onPaneClick = useCallback(() => {
        selectNode(null);
    }, [selectNode]);

    return (
        <div ref={reactFlowWrapper} className="flex-grow h-full">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                onDrop={onDrop}
                onDragOver={onDragOver}
                nodeTypes={nodeTypes}
                fitView
                className="bg-gray-950"
                deleteKeyCode="Delete"
                multiSelectionKeyCode="Control"
                defaultEdgeOptions={{
                    animated: true,
                    style: {
                        stroke: '#60A5FA',
                        strokeWidth: 2.5
                    },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        width: 20,
                        height: 20,
                        color: '#60A5FA'
                    },
                    type: 'smoothstep'
                }}
            >
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={16}
                    size={1}
                    color="#374151"
                />
                <Controls
                    className="bg-gray-800 border border-gray-700 rounded-lg"
                />
                <MiniMap
                    className="bg-gray-900 border border-gray-700 rounded-lg"
                    nodeColor={(node: any) => {
                        const categoryColors: Record<string, string> = {
                            sensor: '#3B82F6',
                            actuator: '#10B981',
                            logic: '#A855F7',
                            communication: '#F59E0B'
                        };
                        return categoryColors[node.data.category] || '#6B7280';
                    }}
                />
            </ReactFlow>
        </div>
    );
};

export const Canvas: React.FC = () => {
    return (
        <ReactFlowProvider>
            <CanvasContent />
        </ReactFlowProvider>
    );
};
