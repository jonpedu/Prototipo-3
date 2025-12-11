/**
 * ORBITA - useNodeConnections Hook
 * Hook customizado para detectar conexões de entrada em um nó
 */

import { useMemo } from 'react';
import { useOrbitaStore } from '../store/useStore';
import { OrbitaNode } from '../core/types';
import { getDriver } from '../core/drivers';

/**
 * Informação sobre uma conexão de entrada
 */
export interface NodeConnection {
    sourceNode: OrbitaNode;
    sourceHandle: string;      // ID da porta de saída do nó de origem
    sourceHandleLabel: string; // Label amigável da porta
    targetHandle: string;      // ID da porta de entrada do nó atual
    edgeId: string;           // ID da edge para referência
}

/**
 * Hook que retorna todas as conexões de entrada para um nó específico
 * 
 * @param nodeId ID do nó para verificar conexões
 * @returns Array de conexões de entrada
 */
export function useNodeConnections(nodeId: string | null): NodeConnection[] {
    const { nodes, edges } = useOrbitaStore();

    return useMemo(() => {
        if (!nodeId) return [];

        const connections: NodeConnection[] = [];

        // Encontra todas as edges que chegam neste nó
        const incomingEdges = edges.filter(edge => edge.target === nodeId);

        for (const edge of incomingEdges) {
            // Encontra o nó de origem
            const sourceNode = nodes.find(n => n.id === edge.source);
            if (!sourceNode) continue;

            // Obtém o driver do nó de origem para pegar o label da porta
            const sourceDriver = getDriver(sourceNode.data.driverId);
            if (!sourceDriver) continue;

            // Encontra a porta de saída correspondente
            const sourceOutput = sourceDriver.outputs.find(
                output => output.id === edge.sourceHandle
            );

            if (!sourceOutput) continue;

            connections.push({
                sourceNode,
                sourceHandle: edge.sourceHandle || '',
                sourceHandleLabel: sourceOutput.label,
                targetHandle: edge.targetHandle || '',
                edgeId: edge.id
            });
        }

        return connections;
    }, [nodeId, nodes, edges]);
}

/**
 * Hook auxiliar que verifica se um nó tem alguma conexão de entrada
 * 
 * @param nodeId ID do nó para verificar
 * @returns true se o nó tem pelo menos uma conexão de entrada
 */
export function useHasConnections(nodeId: string | null): boolean {
    const connections = useNodeConnections(nodeId);
    return connections.length > 0;
}

/**
 * Hook auxiliar que retorna conexões agrupadas por porta de entrada
 * 
 * @param nodeId ID do nó para verificar
 * @returns Objeto com arrays de conexões agrupados por targetHandle
 */
export function useConnectionsByInput(nodeId: string | null): Record<string, NodeConnection[]> {
    const connections = useNodeConnections(nodeId);

    return useMemo(() => {
        const grouped: Record<string, NodeConnection[]> = {};

        for (const connection of connections) {
            const key = connection.targetHandle;
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(connection);
        }

        return grouped;
    }, [connections]);
}
