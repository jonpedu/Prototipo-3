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
import { getPinLabel, getPinMapping, getHardwareProfile } from '../../config/hardware-profiles';
import { Trash2, X, Zap, AlertTriangle, Minus } from 'lucide-react';
import { getActionDefinition } from '../../config/actions';

type InspectorProps = {
    onCollapse?: () => void;
};

export const Inspector: React.FC<InspectorProps> = ({ onCollapse }) => {
    const {
        selectedNode,
        updateNodeData,
        deleteNode,
        selectNode,
        edges,
        hardwareProfile,
        testActuator,
        selectedActionId,
        selectAction,
        updateActionConfig,
        removeActionFromNode
    } = useOrbitaStore();
    const connections = useNodeConnections(selectedNode?.id || null);

    if (!selectedNode) {
        return (
            <div className="h-full bg-gray-950 p-4 overflow-y-auto">
                <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                    Selecione um componente para configurar
                </div>
            </div>
        );
    }

    const driver = getDriver(selectedNode.data.driverId);

    if (!driver) {
        return (
            <div className="h-full bg-gray-950 p-4 overflow-y-auto">
                <div className="text-red-400 text-sm">Driver não encontrado</div>
            </div>
        );
    }

    const params = selectedNode.data.parameters || {};
    const actions = selectedNode.data.actions || [];
    const selectedAction = actions.find(action => action.id === selectedActionId) || null;
    const selectedActionDefinition = selectedAction ? getActionDefinition(selectedAction.type) : null;
    const hasLedAction = actions.some(action => action.type.startsWith('led_'));

    const warnings: string[] = [];

    if (driver.id === 'led_output') {
        const interval = Number(params.blink_interval ?? 0);
        if (params.blink_enabled && interval < 100) {
            warnings.push('Intervalo de pisca abaixo de 100 ms pode não ser visível ou travar o loop.');
        }
        if (params.blink_count_enabled && params.blink_count <= 0) {
            warnings.push('Quantidade de piscadas deve ser maior que zero.');
        }
    }

    if (driver.id === 'buzzer') {
        const interval = Number(params.repeat_interval ?? 0);
        if (params.repeat_enabled && interval < 100) {
            warnings.push('Intervalo de repetição menor que 100 ms pode travar o dispositivo.');
        }
        if (params.repeat_count_enabled && params.repeat_count <= 0) {
            warnings.push('Quantidade de toques deve ser maior que zero.');
        }
    }

    if (driver.id === 'sequence_timer') {
        const durations = [params.step1_duration, params.step2_duration, params.step3_duration, params.step4_duration].map(Number).filter(d => !Number.isNaN(d));
        const validDurations = durations.filter(d => d > 0);
        if (validDurations.length === 0) {
            warnings.push('Defina ao menos um passo com duração maior que zero.');
        }
        if (validDurations.some(d => d < 100)) {
            warnings.push('Passos abaixo de 100 ms podem ser ignorados pelo hardware.');
        }
    }

    if (driver.id === 'delay_trigger') {
        if (params.delay_ms < 0) {
            warnings.push('Atraso inicial não pode ser negativo.');
        }
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

    const connectionSummaries = connections.map(connection => {
        const targetLabel = driver?.inputs.find(i => i.id === connection.targetHandle)?.label || connection.targetHandle;
        return {
            id: connection.edgeId,
            sourceLabel: connection.sourceNode.data.label,
            sourceHandleLabel: connection.sourceHandleLabel,
            targetLabel
        };
    });

    const sensorConnections = connections.filter(c => c.sourceNode.data.category === HardwareCategory.SENSOR);

    const handleActionFieldChange = (fieldId: string, value: any) => {
        if (!selectedAction) return;
        updateActionConfig(selectedNode.id, selectedAction.id, { [fieldId]: value });
    };

    return (
        <div className="h-full bg-gray-950 overflow-y-auto p-4 space-y-4">
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex-grow">
                        <h2 className="text-lg font-semibold text-gray-200">{driver.name}</h2>
                        <p className="text-xs text-gray-500 mt-1">{driver.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {onCollapse && (
                            <button
                                onClick={onCollapse}
                                className="text-gray-400 hover:text-gray-200 transition-colors"
                                title="Minimizar painel"
                            >
                                <Minus className="w-5 h-5" />
                            </button>
                        )}
                        <button
                            onClick={() => selectNode(null)}
                            className="text-gray-400 hover:text-gray-200 transition-colors"
                            title="Fechar seleção"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
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

                {/* Conexões ativas */}
                {warnings.length > 0 && (
                    <Card className="bg-yellow-900/20 border-yellow-700/50">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-400" />
                            <h3 className="text-sm font-semibold text-yellow-200">Atenção</h3>
                        </div>
                        <div className="space-y-1 text-xs text-yellow-100">
                            {warnings.map((w, idx) => (
                                <div key={idx} className="leading-snug">• {w}</div>
                            ))}
                        </div>
                    </Card>
                )}

                {connectionSummaries.length > 0 && (
                    <Card className="bg-gray-900/50">
                        <h3 className="text-sm font-semibold text-gray-300 mb-3">Conexões</h3>
                        <div className="space-y-2 text-xs text-gray-300">
                            {connectionSummaries.map(conn => (
                                <div key={conn.id} className="flex flex-col gap-0.5 bg-gray-800/60 border border-gray-700/70 rounded px-2 py-1.5">
                                    <div className="text-gray-200">{conn.sourceLabel}</div>
                                    <div className="text-gray-400">
                                        {conn.sourceHandleLabel} → {conn.targetLabel}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Acoes anexadas */}
                {selectedNode.data.category === HardwareCategory.ACTUATOR && (
                    <Card className="bg-gray-900/50">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-gray-300">Ações</h3>
                            {actions.length > 0 && (
                                <span className="text-xs text-gray-500">{actions.length} anexadas</span>
                            )}
                        </div>

                        {actions.length === 0 && (
                            <p className="text-xs text-gray-500">Arraste uma ação do painel inferior para iniciar.</p>
                        )}

                        {actions.length > 0 && (
                            <div className="space-y-2 mb-3">
                                {actions.map(action => (
                                    <div
                                        key={action.id}
                                        className={`flex items-center justify-between px-2 py-2 rounded border text-xs ${selectedActionId === action.id ? 'border-blue-500 bg-blue-500/10 text-blue-100' : 'border-gray-700 bg-gray-800/70 text-gray-300'}`}
                                    >
                                        <button
                                            className="flex-1 text-left"
                                            onClick={() => selectAction(action.id)}
                                        >
                                            {action.label}
                                        </button>
                                        <button
                                            onClick={() => removeActionFromNode(selectedNode.id, action.id)}
                                            className="text-gray-400 hover:text-red-400 ml-2"
                                            aria-label="Remover ação"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {selectedAction && selectedActionDefinition && (
                            <div className="space-y-3">
                                <div className="text-xs text-gray-400">Configuração: {selectedAction.label}</div>
                                {selectedActionDefinition.fields.map(field => {
                                    const value = selectedAction.config[field.id] ?? field.default;

                                    if (field.type === 'number') {
                                        return (
                                            <div key={field.id}>
                                                <label className="block text-xs text-gray-400 mb-1">{field.label}</label>
                                                <input
                                                    type="number"
                                                    value={value}
                                                    min={field.min}
                                                    max={field.max}
                                                    onChange={(e) => handleActionFieldChange(field.id, Number(e.target.value))}
                                                    className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        );
                                    }

                                    if (field.type === 'boolean') {
                                        return (
                                            <label key={field.id} className="flex items-center gap-2 text-sm text-gray-300">
                                                <input
                                                    type="checkbox"
                                                    checked={value}
                                                    onChange={(e) => handleActionFieldChange(field.id, e.target.checked)}
                                                    className="w-4 h-4 rounded bg-gray-800 border-gray-700 text-blue-600 focus:ring-2 focus:ring-blue-500"
                                                />
                                                {field.label}
                                            </label>
                                        );
                                    }

                                    if (field.type === 'select' && field.options) {
                                        return (
                                            <div key={field.id}>
                                                <label className="block text-xs text-gray-400 mb-1">{field.label}</label>
                                                <select
                                                    value={value}
                                                    onChange={(e) => handleActionFieldChange(field.id, e.target.value)}
                                                    className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    {field.options.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={field.id}>
                                            <label className="block text-xs text-gray-400 mb-1">{field.label}</label>
                                            <input
                                                type="text"
                                                value={value}
                                                onChange={(e) => handleActionFieldChange(field.id, e.target.value)}
                                                className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>
                )}

                {/* Parâmetros */}
                {driver.parameters.length > 0 && (
                    <Card className="bg-gray-900/50">
                        <h3 className="text-sm font-semibold text-gray-300 mb-3">Configurações</h3>

                        <div className="space-y-3">
                            {driver.parameters.map(param => {
                                const isPinField = ['pin', 'cs_pin', 'sda', 'scl', 'pin_r', 'pin_g', 'pin_b'].includes(param.id);
                                const profilePin = isPinField ? getPinMapping(hardwareProfile, selectedNode.data.driverId, param.id) : null;
                                const pinLabel = isPinField && profilePin !== null
                                    ? getPinLabel(hardwareProfile, selectedNode.data.driverId, param.id)
                                    : null;

                                const pinIsLocked = profilePin !== null && isPinField;
                                const profileName = pinIsLocked ? getHardwareProfile(hardwareProfile).name : '';

                                const isLedTypeField = param.id === 'led_type';
                                const selectDisabled = isLedTypeField && hasLedAction;

                                const value = pinIsLocked
                                    ? profilePin
                                    : (selectedNode.data.parameters[param.id] ?? param.default);

                                const hideForAction = (
                                    (driver.id === 'led_output' && [
                                        'preset_color',
                                        'blink_enabled',
                                        'blink_interval',
                                        'blink_count_enabled',
                                        'blink_count'
                                    ].includes(param.id)) ||
                                    (driver.id === 'buzzer' && [
                                        'tone',
                                        'duration',
                                        'repeat_enabled',
                                        'repeat_interval',
                                        'repeat_count_enabled',
                                        'repeat_count'
                                    ].includes(param.id))
                                );

                                if (hideForAction) return null;

                                // LED: alterna campos para modo branco vs RGB
                                if (driver.id === 'led_output') {
                                    const mode = selectedNode.data.parameters['led_type'] || 'white';
                                    const isRgb = mode === 'rgb';

                                    if (!isRgb && ['pin_r', 'pin_g', 'pin_b', 'preset_color'].includes(param.id)) {
                                        return null;
                                    }
                                    if (isRgb && ['pin', 'blink_enabled', 'blink_interval', 'blink_count_enabled', 'blink_count'].includes(param.id)) {
                                        return null;
                                    }
                                }

                                // Regra dinâmica para o comparador: esconder operadores/limites quando o modo não requer
                                if (driver.id === 'comparator') {
                                    const mode = selectedNode.data.parameters['mode'] || 'inputs';
                                    const hideThresholds = mode === 'inputs';

                                    if (param.id === 'operator' && mode === 'thresholds') return null;
                                    if (['a_operator', 'a_threshold', 'b_operator', 'b_threshold', 'combine_operator'].includes(param.id) && hideThresholds) {
                                        return null;
                                    }
                                }

                                return (
                                    <div key={param.id}>
                                        <label className="block text-xs font-medium text-gray-400 mb-1" title={pinIsLocked ? `Travado pelo perfil ${profileName}` : undefined}>
                                            {pinLabel || param.label}
                                            {pinIsLocked && (
                                                <span className="ml-2 text-xs text-yellow-500" title={`Travado pelo perfil ${profileName}`}>(Travado)</span>
                                            )}
                                            {selectDisabled && (
                                                <span className="ml-2 text-xs text-blue-400" title="Definido automaticamente pela ação anexada">(Definido pela ação)</span>
                                            )}
                                        </label>

                                        {param.type === 'number' && (
                                            <input
                                                type="number"
                                                value={value}
                                                min={param.min}
                                                max={param.max}
                                                disabled={pinIsLocked}
                                                tabIndex={pinIsLocked ? -1 : undefined}
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
                                                disabled={selectDisabled}
                                                tabIndex={selectDisabled ? -1 : undefined}
                                                className={`
                                                    w-full px-3 py-2 rounded
                                                    bg-gray-800 border border-gray-700
                                                    text-gray-200 text-sm
                                                    focus:outline-none focus:ring-2 focus:ring-blue-500
                                                    ${selectDisabled ? 'opacity-60 cursor-not-allowed' : ''}
                                                `}
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
                {driver.category !== HardwareCategory.ACTUATOR && driver.dynamicParameters && driver.dynamicParameters.map(dynamicGroup => {
                    // Verifica se há uma conexão na porta especificada
                    const hasConnection = edges.some(edge =>
                        edge.target === selectedNode.id && edge.targetHandle === dynamicGroup.inputId
                    );

                    if (!hasConnection) return null;

                    const inputPort = driver.inputs.find(i => i.id === dynamicGroup.inputId);
                    const connectedSource = connections.find(c => c.targetHandle === dynamicGroup.inputId);

                    return (
                        <Card key={dynamicGroup.inputId} className="bg-blue-900/20 border-blue-700/50">
                            <div className="flex items-center gap-2 mb-3">
                                <Zap className="w-4 h-4 text-blue-400" />
                                <h3 className="text-sm font-semibold text-blue-300">
                                    Condições: {inputPort?.label || dynamicGroup.inputId}
                                </h3>
                            </div>
                            {connectedSource && (
                                <div className="text-xs text-blue-300/70 mb-3">
                                    Conectado a: "{connectedSource.sourceNode.data.label}" → {connectedSource.sourceHandleLabel}
                                </div>
                            )}

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
                {selectedNode.data.category === HardwareCategory.ACTUATOR && sensorConnections.length > 0 && (
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
                            {sensorConnections.map(connection => {
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
                {selectedNode.data.category === HardwareCategory.ACTUATOR && (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => testActuator(selectedNode.id)}
                        className="w-full"
                    >
                        <Zap className="w-4 h-4" />
                        Testar agora
                    </Button>
                )}

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
