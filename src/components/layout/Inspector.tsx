/**
 * ORBITA - Inspector
 * Painel lateral para configuração de nós selecionados
 */

import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useOrbitaStore } from '../../store/useStore';
import { getDriver } from '../../core/drivers';
import { useNodeConnections } from '../../hooks/useNodeConnections';
import { HardwareCategory, LogicRule, LogicOperator, LogicAction } from '../../core/types';
import { isPinLocked, getPinLabel } from '../../config/hardware-profiles';
import { Trash2, X, Zap } from 'lucide-react';

export const Inspector: React.FC = () => {
    const { selectedNode, updateNodeData, deleteNode, selectNode, edges, hardwareProfile } = useOrbitaStore();
    const connections = useNodeConnections(selectedNode?.id || null);

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

    const handleLogicRuleChange = (
        sourceId: string,
        sourceHandle: string,
        field: keyof LogicRule,
        value: any
    ) => {
        const logicRules = selectedNode.data.logicRules || [];
        const existingRuleIndex = logicRules.findIndex(
            r => r.sourceId === sourceId && r.sourceHandle === sourceHandle
        );

        if (existingRuleIndex >= 0) {
            // Atualiza regra existente
            const updatedRules = [...logicRules];
            updatedRules[existingRuleIndex] = {
                ...updatedRules[existingRuleIndex],
                [field]: value
            };
            updateNodeData(selectedNode.id, { logicRules: updatedRules });
        } else {
            // Cria nova regra
            const connection = connections.find(
                c => c.sourceNode.id === sourceId && c.sourceHandle === sourceHandle
            );
            if (!connection) return;

            const newRule: LogicRule = {
                sourceId,
                sourceType: connection.sourceNode.data.driverId,
                sourceHandle,
                condition: LogicOperator.GREATER_THAN,
                value: 0,
                action: LogicAction.TURN_ON,
                [field]: value
            };
            updateNodeData(selectedNode.id, {
                logicRules: [...logicRules, newRule]
            });
        }
    };

    const getLogicRule = (sourceId: string, sourceHandle: string): LogicRule | undefined => {
        return selectedNode.data.logicRules?.find(
            r => r.sourceId === sourceId && r.sourceHandle === sourceHandle
        );
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
                                
                                // Hardware profile constraints para pinos GPIO
                                const isGpioPin = param.id === 'pin';
                                const pinIsLocked = isGpioPin && isPinLocked(hardwareProfile, selectedNode.data.driverId);
                                const pinLabel = isGpioPin ? getPinLabel(hardwareProfile, selectedNode.data.driverId) : null;

                                return (
                                    <div key={param.id}>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">
                                            {pinLabel || param.label}
                                            {pinIsLocked && (
                                                <span className="ml-2 text-xs text-yellow-500">(Travado)</span>
                                            )}
                                        </label>

                                        {param.type === 'number' && (
                                            <input
                                                type="number"
                                                value={value}
                                                min={param.min}
                                                max={param.max}
                                                disabled={pinIsLocked}
                                                onChange={(e) => handleParameterChange(param.id, Number(e.target.value))}
                                                className={`
                          w-full px-3 py-2 rounded
                          bg-gray-800 border border-gray-700
                          text-gray-200 text-sm
                          focus:outline-none focus:ring-2 focus:ring-blue-500
                          ${pinIsLocked ? 'opacity-60 cursor-not-allowed' : ''}
                        `}
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

                {/* Seção de Lógica/Automação para Atuadores com Conexões de Sensores */}
                {selectedNode.data.category === HardwareCategory.ACTUATOR && connections.length > 0 && (
                    <Card className="bg-purple-900/20 border-purple-700/50">
                        <div className="flex items-center gap-2 mb-3">
                            <Zap className="w-4 h-4 text-purple-400" />
                            <h3 className="text-sm font-semibold text-purple-300">
                                Automação / Gatilhos
                            </h3>
                        </div>
                        <p className="text-xs text-purple-300/70 mb-4">
                            Configure condições para ativar este atuador baseado nos sensores conectados.
                        </p>

                        <div className="space-y-4">
                            {connections.map(connection => {
                                const rule = getLogicRule(connection.sourceNode.id, connection.sourceHandle);
                                
                                return (
                                    <div key={`${connection.sourceNode.id}-${connection.sourceHandle}`} className="p-3 bg-gray-800/50 rounded border border-purple-700/30">
                                        <div className="text-xs font-medium text-purple-200 mb-2">
                                            "{connection.sourceNode.data.label}" → {connection.sourceHandleLabel}
                                        </div>

                                        <div className="space-y-2">
                                            {/* Operador */}
                                            <div>
                                                <label className="block text-xs text-gray-400 mb-1">
                                                    Condição
                                                </label>
                                                <select
                                                    value={rule?.condition || LogicOperator.GREATER_THAN}
                                                    onChange={(e) => handleLogicRuleChange(
                                                        connection.sourceNode.id,
                                                        connection.sourceHandle,
                                                        'condition',
                                                        e.target.value as LogicOperator
                                                    )}
                                                    className="w-full px-2 py-1.5 rounded bg-gray-800 border border-purple-700/50 text-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                >
                                                    <option value={LogicOperator.GREATER_THAN}>Maior que (&gt;)</option>
                                                    <option value={LogicOperator.LESS_THAN}>Menor que (&lt;)</option>
                                                    <option value={LogicOperator.GREATER_EQUAL}>Maior ou igual (≥)</option>
                                                    <option value={LogicOperator.LESS_EQUAL}>Menor ou igual (≤)</option>
                                                    <option value={LogicOperator.EQUAL}>Igual (=)</option>
                                                    <option value={LogicOperator.NOT_EQUAL}>Diferente (≠)</option>
                                                </select>
                                            </div>

                                            {/* Valor */}
                                            <div>
                                                <label className="block text-xs text-gray-400 mb-1">
                                                    Valor Limite
                                                </label>
                                                <input
                                                    type="number"
                                                    value={rule?.value ?? 0}
                                                    onChange={(e) => handleLogicRuleChange(
                                                        connection.sourceNode.id,
                                                        connection.sourceHandle,
                                                        'value',
                                                        Number(e.target.value)
                                                    )}
                                                    className="w-full px-2 py-1.5 rounded bg-gray-800 border border-purple-700/50 text-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                />
                                            </div>

                                            {/* Ação */}
                                            <div>
                                                <label className="block text-xs text-gray-400 mb-1">
                                                    Ação
                                                </label>
                                                <select
                                                    value={rule?.action || LogicAction.TURN_ON}
                                                    onChange={(e) => handleLogicRuleChange(
                                                        connection.sourceNode.id,
                                                        connection.sourceHandle,
                                                        'action',
                                                        e.target.value as LogicAction
                                                    )}
                                                    className="w-full px-2 py-1.5 rounded bg-gray-800 border border-purple-700/50 text-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                >
                                                    <option value={LogicAction.TURN_ON}>Ligar</option>
                                                    <option value={LogicAction.TURN_OFF}>Desligar</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                )}

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
