/**
 * ORBITA - Custom Node para React Flow
 * Nó minimalista com ícone, nome e portas
 */

import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { OrbitaNodeData, HardwareCategory } from '../../core/types';
import { getDriver } from '../../core/drivers';
import * as LucideIcons from 'lucide-react';

const OrbitaNode: React.FC<NodeProps> = ({ data: nodeData, selected }) => {
    const data = nodeData as OrbitaNodeData;
    const driver = getDriver(data.driverId);

    const shorten = (label: string) => {
        if (label.length <= 12) return label;
        return `${label.slice(0, 11)}…`;
    };

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

    const inputs = driver?.inputs || [];
    const outputs = driver?.outputs || [];

    // Calcula offsets verticais para distribuir os handles
    const handleOffset = (index: number, total: number) => {
        const spacing = 22;
        const start = -((total - 1) * spacing) / 2;
        return start + index * spacing;
    };

    return (
        <div
            className={`
        relative px-4 py-3 rounded-lg border-2 
        ${borderColor} ${glowColor}
        backdrop-blur-sm
        min-w-[220px]
        transition-all duration-200
        ${selected ? 'ring-2 ring-white/30' : ''}
      `}
        >
            {/* Handles de entrada (esquerda) + rótulo */}
            {inputs.map((input, index) => (
                <div
                    key={input.id}
                    className="absolute left-0 flex items-center gap-1"
                    style={{ top: '50%', transform: `translate(-50%, ${handleOffset(index, inputs.length)}px)` }}
                >
                    <Handle
                        id={input.id}
                        type="target"
                        position={Position.Left}
                        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-blue-300 hover:!bg-blue-300"
                    />
                    <span className="text-[10px] text-blue-100 bg-blue-900/70 border border-blue-700/70 px-1 py-0.5 rounded-sm whitespace-nowrap">
                        {shorten(input.label || input.id)}
                    </span>
                </div>
            ))}

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

            {/* Handles de saída (direita) + rótulo */}
            {outputs.map((output, index) => (
                <div
                    key={output.id}
                    className="absolute right-0 flex items-center gap-1 justify-end"
                    style={{ top: '50%', transform: `translate(50%, ${handleOffset(index, outputs.length)}px)` }}
                >
                    <span className="text-[10px] text-green-100 bg-green-900/70 border border-green-700/70 px-1 py-0.5 rounded-sm whitespace-nowrap">
                        {shorten(output.label || output.id)}
                    </span>
                    <Handle
                        id={output.id}
                        type="source"
                        position={Position.Right}
                        className="!w-3 !h-3 !bg-green-500 !border-2 !border-green-300 hover:!bg-green-300"
                    />
                </div>
            ))}
        </div>
    );
};

export default OrbitaNode;
