/**
 * ORBITA - Inspector
 * Painel lateral para configuração de nós selecionados
 */

import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useOrbitaStore } from '../../store/useStore';
import { getDriver } from '../../core/drivers';
import { Trash2, X } from 'lucide-react';

export const Inspector: React.FC = () => {
    const { selectedNode, updateNodeData, deleteNode, selectNode, edges } = useOrbitaStore();

    if (!selectedNode) {
        return (
            <div className="w-80 bg-gray-950 border-l border-gray-800 p-4">
                <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                    Selecione um componente para configurar
                </div>
            </div>
        );
    }

    const driver = getDriver(selectedNode.data.driverId);

    if (!driver) {
        return (
            <div className="w-80 bg-gray-950 border-l border-gray-800 p-4">
                <div className="text-red-400 text-sm">Driver não encontrado</div>
            </div>
        );
    }

    const handleParameterChange = (parameterId: string, value: any) => {
        updateNodeData(selectedNode.id, {
            parameters: {
                ...selectedNode.data.parameters,
                [parameterId]: value
            }
        });
    };

    const handleDelete = () => {
        deleteNode(selectedNode.id);
    };

    return (
        <div className="w-80 bg-gray-950 border-l border-gray-800 overflow-y-auto">
            <div className="p-4 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex-grow">
                        <h2 className="text-lg font-semibold text-gray-200">{driver.name}</h2>
                        <p className="text-xs text-gray-500 mt-1">{driver.description}</p>
                    </div>
                    <button
                        onClick={() => selectNode(null)}
                        className="text-gray-400 hover:text-gray-200 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Nome do nó */}
                <Card className="bg-gray-900/50">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Nome do Componente
                    </label>
                    <input
                        type="text"
                        value={selectedNode.data.label}
                        onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
                        className="
              w-full px-3 py-2 rounded
              bg-gray-800 border border-gray-700
              text-gray-200 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
                    />
                </Card>

                {/* Parâmetros */}
                {driver.parameters.length > 0 && (
                    <Card className="bg-gray-900/50">
                        <h3 className="text-sm font-semibold text-gray-300 mb-3">Configurações</h3>

                        <div className="space-y-3">
                            {driver.parameters.map(param => {
                                const value = selectedNode.data.parameters[param.id] ?? param.default;

                                return (
                                    <div key={param.id}>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">
                                            {param.label}
                                        </label>

                                        {param.type === 'number' && (
                                            <input
                                                type="number"
                                                value={value}
                                                min={param.min}
                                                max={param.max}
                                                onChange={(e) => handleParameterChange(param.id, Number(e.target.value))}
                                                className="
                          w-full px-3 py-2 rounded
                          bg-gray-800 border border-gray-700
                          text-gray-200 text-sm
                          focus:outline-none focus:ring-2 focus:ring-blue-500
                        "
                                            />
                                        )}

                                        {param.type === 'string' && (
                                            <input
                                                type="text"
                                                value={value}
                                                onChange={(e) => handleParameterChange(param.id, e.target.value)}
                                                className="
                          w-full px-3 py-2 rounded
                          bg-gray-800 border border-gray-700
                          text-gray-200 text-sm
                          focus:outline-none focus:ring-2 focus:ring-blue-500
                        "
                                            />
                                        )}

                                        {param.type === 'boolean' && (
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={value}
                                                    onChange={(e) => handleParameterChange(param.id, e.target.checked)}
                                                    className="
                            w-4 h-4 rounded
                            bg-gray-800 border-gray-700
                            text-blue-600 focus:ring-2 focus:ring-blue-500
                          "
                                                />
                                                <span className="text-sm text-gray-300">Ativo</span>
                                            </label>
                                        )}

                                        {param.type === 'select' && param.options && (
                                            <select
                                                value={value}
                                                onChange={(e) => handleParameterChange(param.id, e.target.value)}
                                                className="
                          w-full px-3 py-2 rounded
                          bg-gray-800 border border-gray-700
                          text-gray-200 text-sm
                          focus:outline-none focus:ring-2 focus:ring-blue-500
                        "
                                            >
                                                {param.options.map(opt => (
                                                    <option key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                )}

                {/* Parâmetros Dinâmicos (baseados em conexões) */}
                {driver.dynamicParameters && driver.dynamicParameters.map(dynamicGroup => {
                    // Verifica se há uma conexão na porta especificada
                    const hasConnection = edges.some(edge =>
                        edge.target === selectedNode.id && edge.targetHandle === dynamicGroup.inputId
                    );

                    if (!hasConnection) return null;

                    return (
                        <Card key={dynamicGroup.inputId} className="bg-blue-900/20 border-blue-700/50">
                            <h3 className="text-sm font-semibold text-blue-300 mb-3">
                                Condições da Entrada "{driver.inputs.find(i => i.id === dynamicGroup.inputId)?.label}"
                            </h3>

                            <div className="space-y-3">
                                {dynamicGroup.parameters.map(param => {
                                    const value = selectedNode.data.parameters[param.id] ?? param.default;

                                    return (
                                        <div key={param.id}>
                                            <label className="block text-xs font-medium text-blue-300 mb-1">
                                                {param.label}
                                            </label>

                                            {param.type === 'number' && (
                                                <input
                                                    type="number"
                                                    value={value}
                                                    min={param.min}
                                                    max={param.max}
                                                    onChange={(e) => handleParameterChange(param.id, Number(e.target.value))}
                                                    className="
                              w-full px-3 py-2 rounded
                              bg-gray-800 border border-blue-700
                              text-gray-200 text-sm
                              focus:outline-none focus:ring-2 focus:ring-blue-500
                            "
                                                />
                                            )}

                                            {param.type === 'select' && param.options && (
                                                <select
                                                    value={value}
                                                    onChange={(e) => handleParameterChange(param.id, e.target.value)}
                                                    className="
                              w-full px-3 py-2 rounded
                              bg-gray-800 border border-blue-700
                              text-gray-200 text-sm
                              focus:outline-none focus:ring-2 focus:ring-blue-500
                            "
                                                >
                                                    {param.options.map(opt => (
                                                        <option key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    );
                })}

                {/* Portas */}
                <Card className="bg-gray-900/50">
                    <h3 className="text-sm font-semibold text-gray-300 mb-2">Conectores</h3>

                    {driver.inputs.length > 0 && (
                        <div className="mb-3">
                            <div className="text-xs font-medium text-gray-400 mb-1">Entradas</div>
                            <div className="space-y-1">
                                {driver.inputs.map(input => (
                                    <div key={input.id} className="text-xs text-gray-500">
                                        • {input.label} ({input.type})
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {driver.outputs.length > 0 && (
                        <div>
                            <div className="text-xs font-medium text-gray-400 mb-1">Saídas</div>
                            <div className="space-y-1">
                                {driver.outputs.map(output => (
                                    <div key={output.id} className="text-xs text-gray-500">
                                        • {output.label} ({output.type})
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>

                {/* Ações */}
                <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDelete}
                    className="w-full"
                >
                    <Trash2 className="w-4 h-4" />
                    Remover Componente
                </Button>
            </div>
        </div>
    );
};
