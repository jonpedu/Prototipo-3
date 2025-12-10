/**
 * ORBITA - Custom Node para React Flow
 * Nó minimalista com ícone, nome e portas
 */

import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { OrbitaNodeData, HardwareCategory } from '../../core/types';
import * as LucideIcons from 'lucide-react';

const OrbitaNode: React.FC<NodeProps> = ({ data: nodeData, selected }) => {
    const data = nodeData as OrbitaNodeData;

    // Obtém o ícone dinamicamente
    const IconComponent = (LucideIcons as any)[data.icon] || LucideIcons.Box;

    // Cores por categoria
    const categoryColors = {
        [HardwareCategory.SENSOR]: 'border-blue-500 bg-blue-950/50',
        [HardwareCategory.ACTUATOR]: 'border-green-500 bg-green-950/50',
        [HardwareCategory.LOGIC]: 'border-purple-500 bg-purple-950/50',
        [HardwareCategory.COMMUNICATION]: 'border-yellow-500 bg-yellow-950/50'
    };

    const categoryGlow = {
        [HardwareCategory.SENSOR]: 'shadow-blue-500/30',
        [HardwareCategory.ACTUATOR]: 'shadow-green-500/30',
        [HardwareCategory.LOGIC]: 'shadow-purple-500/30',
        [HardwareCategory.COMMUNICATION]: 'shadow-yellow-500/30'
    };

    const borderColor = categoryColors[data.category] || 'border-gray-500 bg-gray-950/50';
    const glowColor = selected
        ? 'shadow-xl shadow-white/20'
        : `shadow-lg ${categoryGlow[data.category] || 'shadow-gray-500/20'}`;

    return (
        <div
            className={`
        relative px-4 py-3 rounded-lg border-2 
        ${borderColor} ${glowColor}
        backdrop-blur-sm
        min-w-[180px]
        transition-all duration-200
        ${selected ? 'ring-2 ring-white/30' : ''}
      `}
        >
            {/* Handles de entrada (topo) */}
            <Handle
                type="target"
                position={Position.Top}
                className="!w-3 !h-3 !bg-gray-600 !border-2 !border-gray-400 hover:!bg-gray-400"
            />

            {/* Conteúdo do nó */}
            <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                    <IconComponent className="w-6 h-6 text-gray-200" />
                </div>
                <div className="flex-grow min-w-0">
                    <div className="text-sm font-semibold text-gray-100 truncate">
                        {data.label}
                    </div>
                </div>
            </div>

            {/* Handles de saída (base) */}
            <Handle
                type="source"
                position={Position.Bottom}
                className="!w-3 !h-3 !bg-gray-600 !border-2 !border-gray-400 hover:!bg-gray-400"
            />
        </div>
    );
};

export default OrbitaNode;
